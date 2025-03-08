const csvtojson = require("csvtojson");
const { MongoClient } = require("mongodb");
const path = require('path');

// CSV file paths
const bankFile = path.join(__dirname, "banks.csv");
const linkFile = path.join(__dirname, "links.csv");

// Connection URL
const url = "mongodb://localhost:27017/";
const dbName = "hclDB";

async function importData() {
    let client;
    try {
        // Connect to MongoDB
        client = await MongoClient.connect(url);
        console.log("Connected to MongoDB");
        
        const db = client.db(dbName);
        

        // Import banks.csv
        const banksData = await csvtojson().fromFile(bankFile);
        // console.log("Banks data sample:", banksData[0]);
        if (banksData.length > 0) {
            await db.collection("Banks").insertMany(banksData);
            console.log(`Imported ${banksData.length} banks`);
        } else {
            console.error("No data found in banks.csv");
        }

        // Import links.csv
        const linksData = await csvtojson().fromFile(linkFile);
        // console.log("Links data sample:", linksData[0]);
        if (linksData.length > 0) {
            await db.collection("Links").insertMany(linksData);
            console.log(`Imported ${linksData.length} links`);
        } else {
            console.error("No data found in links.csv");
        }

        // Verify the data
        const banksCount = await db.collection("Banks").countDocuments();
        const linksCount = await db.collection("Links").countDocuments();
        
        console.log("\nData Import Summary:");
        console.log(`Banks in database: ${banksCount}`);
        console.log(`Links in database: ${linksCount}`);

        // Create indexes for better performance
        await db.collection("Banks").createIndex({ BIC: 1 });
        await db.collection("Links").createIndex({ FromBIC: 1 });
        await db.collection("Links").createIndex({ ToBIC: 1 });
        
        console.log("\nImport completed successfully!");
    } catch (error) {
        console.error("Error during import:", error);
        process.exit(1);
    } finally {
        if (client) {
            await client.close();
            console.log("Database connection closed");
        }
    }
}

// Run the import
importData(); 