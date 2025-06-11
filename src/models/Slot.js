const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  slotNumber: {
    type: Number,
    required: true,
    unique: true,
    min: 1,
    max: 12
  },
  price: {
    type: Number,
    required: true
  },
  matrixIncomePercentage: {
    type: Number,
    default: 50
  },
  levelIncomePercentage: {
    type: Number,
    default: 30
  },
  poolIncomePercentage: {
    type: Number,
    default: 20
  },
  rebirthRequired: {
    type: Boolean,
    default: true
  },
  rebirthThreshold: {
    type: Number,
    default: 1000
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  slotImage: {
    type: String
  },
  purchaseCount: {
    type: Number,
    default: 0
  },
  lastPurchaseDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
slotSchema.index({ slotNumber: 1 });
slotSchema.index({ price: 1 });

// --- Atomic update static methods ---

/**
 * Atomically increment purchaseCount and update lastPurchaseDate
 * @param {number} slotNumber
 * @returns {Promise}
 */
slotSchema.statics.recordPurchase = function (slotNumber) {
  return this.updateOne(
    { slotNumber },
    {
      $inc: { purchaseCount: 1 },
      $set: { lastPurchaseDate: new Date() }
    }
  ).exec();
};

/**
 * Atomically update slot details (e.g. price or percentages)
 * @param {number} slotNumber
 * @param {object} updateFields
 * @returns {Promise}
 */
slotSchema.statics.updateSlotDetails = function (slotNumber, updateFields) {
  return this.updateOne(
    { slotNumber },
    {
      $set: updateFields
    }
  ).exec();
};

module.exports = mongoose.model('Slot', slotSchema);
// This model defines the Slot schema with atomic update methods for purchase tracking and slot detail updates.
// It includes fields for slot number, price, income percentages, rebirth settings, and purchase tracking.
// It also includes indexes for efficient querying by slot number and price.
// The atomic update methods allow for safe concurrent updates to purchase counts and slot details.
//     method: req.method,
//     ip: req.ip,
//   });
//
//   res.status(500).json({
//     message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
//     stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
//     timestamp: new Date().toISOString(),
//   });
//  // // Graceful shutdown
// const gracefulShutdown = () => {
//   logger.info('Graceful shutdown initiated');
//   if (global.server) {           
//     global.server.close((err) => {
//       if (err) {
//         logger.error('Error during server shutdown', err);
//         process.exit(1);
//       }
//       process.exit(0);
//     });
//
//     setTimeout(() => {
//       logger.warn('Forcing shutdown after timeout');
//       process.exit(1);
//     }, 10000);
//   } else {   
//     process.exit(0);
//   }
// };
// };
// process.on('SIGINT', gracefulShutdown);
// process.on('SIGTERM', gracefulShutdown);
// process.on('SIGQUIT', gracefulShutdown);
//
// process.on('unhandledRejection', (reason, promise) => {
//   logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
// });
// process.on('uncaughtException', (error) => {     
//   logger.error('Uncaught Exception:', error);        
//   process.exit(1);
// });
// This code defines a Mongoose model for a Slot in a gaming or application context.
// It includes fields for slot number, price, income percentages, rebirth settings, and purchase tracking.
// The model also includes atomic update methods for recording purchases and updating slot details.
// It uses Mongoose's schema and model features to define the structure and behavior of Slot documents in a MongoDB database.
//     await app.listen(process.env.PORT || 3000);
//     logger.info(`Server running on port ${process.env.PORT || 3000}`);
//   } catch (error) {
//     logger.error('Error starting server:', error);
//     process.exit(1);
//   }
// }
//     await connectDB();
//     logger.info('MongoDB connected');
//     await startServer();
//     await app.listen(process.env.PORT || 3000);
//     logger.info(`Server running on port ${process.env.PORT || 3000}`);           
//   } catch (error) {
//     logger.error('Error starting server:', error);
//     process.exit(1);
//   }
//     await startServer();
//     await connectDB();
//     logger.info('MongoDB connected');
//     await app.listen(process.env.PORT || 3000);
//     logger.info(`Server running on port ${process.env.PORT || 3000}`);
//     process.exit(1);
//   } catch (error) {
//     logger.error('Error starting server:', error);
//     process.exit(1); 
//   }