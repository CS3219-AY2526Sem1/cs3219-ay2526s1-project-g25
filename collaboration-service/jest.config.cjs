// export default { testEnvironment: 'node', roots: ['<rootDir>/src/__tests__'] };
// module.exports = { testEnvironment: 'node', roots: ['<rootDir>/src/__tests__'] };
module.exports = {
    testEnvironment: 'node',
    roots: ['<rootDir>/src/__tests__'],
    // No extensionsToTreatAsEsm needed since "type":"module" is set
    transform: {}, // keep empty to avoid Babel
};

