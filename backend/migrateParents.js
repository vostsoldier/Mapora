const mongoose = require('mongoose');
const ThinkTreeNode = require('./models/ThinkTreeNode');
require('dotenv').config(); 
const migrateParents = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected for migration');
    const result = await ThinkTreeNode.updateMany(
      { parents: null },
      { $set: { parents: [] } }
    );

    console.log(`✅ Migration completed: ${result.nModified} document(s) updated.`);
    await mongoose.disconnect();
    console.log('🔌 MongoDB connection closed');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1); 
  }
};

migrateParents();