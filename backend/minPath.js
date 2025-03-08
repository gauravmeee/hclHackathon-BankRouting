const { MongoClient } = require("mongodb");

// MongoDB connection URL
const url = "mongodb://localhost:27017/hclDB";

async function initialize() {
    let client;
    try {
        client = await MongoClient.connect(url);
        const db = client.db();

        // Get all links and banks
        const links = await db.collection("Links").find({}).toArray();
        const banks = await db.collection("Banks").find({}).toArray();

        if (!links.length || !banks.length) {
            console.error('No data found in database');
            return { graph: new Map(), bankCharges: new Map() };
        }

        const graph = new Map();
        const bankCharges = new Map();

        // Create graph and store bank charges
        links.forEach(link => {
            if (!graph.has(link.FromBIC)) {
                graph.set(link.FromBIC, new Map());
            }
            if (!graph.has(link.ToBIC)) {
                graph.set(link.ToBIC, new Map());
            }

            // Add both directions since it's an undirected graph
            graph.get(link.FromBIC).set(link.ToBIC, parseInt(link.TimeTakenInMinutes) || 0);
            graph.get(link.ToBIC).set(link.FromBIC, parseInt(link.TimeTakenInMinutes) || 0);
        });

        banks.forEach(bank => {
            bankCharges.set(bank.BIC, parseFloat(bank.Charge) || 0);
        });

        return { graph, bankCharges };
    } catch (err) {
        console.error("Error initializing data:", err);
        return { graph: new Map(), bankCharges: new Map() };
    } finally {
        if (client) await client.close();
    }
}

function minPath(graph, bankCharges, start, end, useTime = false) {
    if (!graph.has(start)) {
        return { path: [], totalCost: -1, totalTime: -1, message: "Start node not found" };
    }

    const nodes = Array.from(graph.keys());
    const distances = new Map();
    const previous = new Map();
    const queue = new Set(nodes);

    // Initialize distances
    nodes.forEach(node => {
        distances.set(node, Infinity);
    });
    distances.set(start, 0);

    while (queue.size > 0) {
        // Find minimum distance node
        let minNode = null;
        let minDist = Infinity;
        for (const node of queue) {
            if (distances.get(node) < minDist) {
                minDist = distances.get(node);
                minNode = node;
            }
        }

        if (minNode === null || minNode === end) break;

        queue.delete(minNode);
        const neighbors = graph.get(minNode);

        for (const [neighbor, time] of neighbors.entries()) {
            if (queue.has(neighbor)) {
                // Key fix: different cost calculations based on optimization goal
                let cost;
                if (useTime) {
                    // For minimum time path, only consider time
                    cost = time;
                } else {
                    // For minimum cost path, consider both bank charges
                    // The charge is for the current bank (not the neighbor bank)
                    cost = bankCharges.get(neighbor);
                }
                
                const alt = distances.get(minNode) + cost;
                
                if (alt < distances.get(neighbor)) {
                    distances.set(neighbor, alt);
                    previous.set(neighbor, minNode);
                }
            }
        }
    }

    // Build path
    const path = [];
    let current = end;

    // Check if destination is reachable
    if (distances.get(end) === Infinity) {
        return { path: [], totalCost: -1, totalTime: -1, message: "No path found" };
    }

    while (current) {
        path.unshift(current);
        current = previous.get(current);
    }

    if (path.length <= 1 || path[0] !== start) {
        return { path: [], totalCost: -1, totalTime: -1, message: "No path found" };
    }

    // Calculate total time and cost for the path
    let totalTime = 0;
    // Exclude the first bank's charge from total cost calculation
    // since we only pay charges for intermediary and destination banks
    let totalCost = 0;

    for (let i = 0; i < path.length - 1; i++) {
        const from = path[i];
        const to = path[i + 1];
        totalTime += graph.get(from).get(to);
        // Add charge for the destination bank
        totalCost += bankCharges.get(to) || 0;
    }

    return {
        path,
        totalCost,
        totalTime,
        message: "Path found successfully"
    };
}

async function findMinCostPath(sourceBIC, destBIC) {
    const { graph, bankCharges } = await initialize();
    return minPath(graph, bankCharges, sourceBIC, destBIC, false);
}

async function findMinTimePath(sourceBIC, destBIC) {
    const { graph, bankCharges } = await initialize();
    return minPath(graph, bankCharges, sourceBIC, destBIC, true);
}

module.exports = { findMinCostPath, findMinTimePath };