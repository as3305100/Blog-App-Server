import mongoose from "mongoose";

const MAX_RETRIES = 3;
const RETRY_INTERVAL = 5000;

class DataConnection {
  constructor() {
    this.isConnected = false;
    this.retryCount = 0;

    mongoose.set("strictQuery", true); // point 1

    mongoose.connection.on("connected", () => {
      console.log("✅ MongoDB connected successfully");
      this.isConnected = true;
    });

    mongoose.connection.on("disconnected", () => {
      if (this.isConnected === false) return;
      console.log("⚠️ MongoDB disconnected");
      this.isConnected = false;
      this.handleConnectionError().catch((error) => {
        console.log(error)
      });
    });

    process.on("SIGINT", this.handleAppTermination.bind(this));
    process.on("SIGTERM", this.handleAppTermination.bind(this));
  }

  async connect() {
    try {
      if (!process.env.MONGO_URI) {
        throw new Error("MongoDB URI is not defined in environment variables");
      }

      const connectionOptions = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 4500,
        family: 4,
      };

      // if (process.env.NODE_ENV === "development") {
      //   mongoose.set("debug", true);
      // }

      await mongoose.connect(process.env.MONGO_URI, connectionOptions);
      this.retryCount = 0;
    } catch (error) {
      console.error("Failed to connect to MongoDB:", error.message);
      return this.handleConnectionError(); // point 2
    }
  }

  async handleConnectionError() {
    if (this.retryCount < MAX_RETRIES) {
      this.retryCount++;
      console.log(
        `Retrying connection... Attempt ${this.retryCount} of ${MAX_RETRIES}`
      );

      await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL));
      return this.connect();
    } else {
      console.error(
        `Failed to connect to MongoDB after ${MAX_RETRIES} attempts`
      );
      process.exit(1);
    }
  }

  async handleAppTermination() {
    try {
      await mongoose.connection.close();
      console.log("MongoDB connection closed through app termination");
      process.exit(0);
    } catch (err) {
      console.error("Error during database disconnection:", err);
      process.exit(1);
    }
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      name: mongoose.connection.name,
    };
  }
}

const dbConnection = new DataConnection();

export const getDBStatus = dbConnection.getConnectionStatus.bind(dbConnection);
export default dbConnection.connect.bind(dbConnection);

// point 1

/*
✅ When strictQuery: true
Only fields defined in your Mongoose schema can be used in queries (like in find, findOne, etc.).
🔒 This is the safe mode. It ignores extra fields in queries.

when strictMode : true

mongoose.set("strictQuery", true);

User.find({ unknownField: "value" });

✅ This ignores unknownField and just runs User.find({}), returning all users.
🔒 It’s like: “Hey, I don’t recognize this field, so I’ll skip it.”



🔍 Query with strictQuery: false

mongoose.set("strictQuery", false);

User.find({ unknownField: "value" });
⚠️ This uses unknownField, even though it’s not in the schema.
Result: It returns an empty array (or filters wrongly), and you might get confused.
*/

// point 2

/*
async function A() {
  return B(); // ✅ passing the result of B to the outside
}
async function B() {
  return "done";
}
A().then(console.log); // logs: "done"


async function A() {
  B(); // ❌ not returning it
}
async function B() {
  return "done";
}
A().then(console.log); // logs: undefined 😐
*/
