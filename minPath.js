}
  
- 	minPath(start, end, useTime = false) {
+ 	calculateTotalMetrics(path) {
+ 		let totalTime = 0;
+ 		let totalCost = 0;
+ 
+ 		// Calculate total time and cost for the path
+ 		for (let i = 0; i < path.length; i++) {
+ 			// Add bank charge
+ 			totalCost += this.bankCharges.get(path[i]);
+ 
+ 			// Add time for the link to next bank
+ 			if (i < path.length - 1) {
+ 				const time = this.graph.get(path[i]).get(path[i + 1]);
+ 				totalTime += time;
+ 				// For cost path, we add time cost too
+ 				totalCost += time;
+ 			}
+ 		}
+ 
+ 		return { totalTime, totalCost };
+ 	}
+ 
+ 	minPath(start, end, useTime = false) {
  		if (!this.graph.has(start)) {
  			return { path: [], totalCost: -1, totalTime: -1, message: "Start node not found" };
  		}
  
  		const nodes = Array.from(this.graph.keys());
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
  			const neighbors = this.graph.get(minNode);
  
  			for (const [neighbor, time] of neighbors.entries()) {
  				if (queue.has(neighbor)) {
- 					const cost = useTime ? time : time + this.bankCharges.get(neighbor);
+ 					// For time optimization, only consider time
+ 					// For cost optimization, consider both time and bank charges
+ 					let cost;
+ 					if (useTime) {
+ 						cost = time;
+ 					} else {
+ 						cost = time + this.bankCharges.get(neighbor);
+ 					}
+ 
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
- 		let totalTime = 0;
  
  		while (current) {
  			path.unshift(current);
- 			const prev = previous.get(current);
- 			if (prev) {
- 				totalTime += this.graph.get(prev).get(current);
- 			}
- 			current = prev;
+ 			current = previous.get(current);
  		}
  
  		if (path.length <= 1 || path[0] !== start) {
  			return { path: [], totalCost: -1, totalTime: -1, message: "No path found" };
  		}
  
- 		const totalCost = path.reduce((sum, bic) => sum + (this.bankCharges.get(bic) || 0), 0);
+ 		// Calculate the actual metrics for the path
+ 		const { totalTime, totalCost } = this.calculateTotalMetrics(path);
  
  		return {
  			path,
  			totalCost,
  			totalTime,
- 			message: "Path found successfully"
+ 			message: `Path found successfully (${useTime ? 'Minimum Time' : 'Minimum Cost'})`
  		};
  	}
  
  	findMinCostPath(sourceBIC, destBIC) {
  		return this.minPath(sourceBIC, destBIC, false);
  	}
  
  	findMinTimePath(sourceBIC, destBIC) {
  		return this.minPath(sourceBIC, destBIC, true);
  	}
  }
  
  module.exports = { BankRouter };
  
  // Example usage
  async function main() {
  	const router = new BankRouter();
  	const initialized = await router.initialize();
  	
  	if (initialized) {
- 		// Example: Find path between two BICs
  		const sourceBIC = "ADDBINBBXXX"; 
  		const destBIC = "IRVTUS3NXXX"; 
  		
+ 		// Test both paths
+ 		console.log("\nFinding Minimum Cost Path:");
  		const result = router.findMinCostPath(sourceBIC, destBIC);
- 		console.log(`From ${sourceBIC} To ${destBIC}`)
  		console.log("Route Result:", result);
+ 
+ 		console.log("\nFinding Minimum Time Path:");
+ 		const timeResult = router.findMinTimePath(sourceBIC, destBIC);
+ 		console.log("Route Result:", timeResult);
  	}
  }
  
  // Run the application
  main().catch(console.error); 