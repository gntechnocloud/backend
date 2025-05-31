// Helper utility functions

const helperFunctions = {
  // Generate random string
  generateRandomString: (length = 10) => {
    return Math.random().toString(36).substring(2, length + 2);
  },

  // Validate Ethereum address
  isValidAddress: (address) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  },

  // Calculate percentage
  calculatePercentage: (amount, percentage) => {
    return (amount * percentage) / 100;
  }
};

module.exports = helperFunctions;
