export const ProfileRegistryABI = [
  {
    "type": "function",
    "name": "getProfile",
    "inputs": [{ "name": "user", "type": "address" }],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "components": [
          { "name": "profileURI", "type": "string" },
          { "name": "createdAt", "type": "uint256" },
          { "name": "updatedAt", "type": "uint256" }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getProfileURI",
    "inputs": [{ "name": "user", "type": "address" }],
    "outputs": [{ "name": "", "type": "string" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "hasProfile",
    "inputs": [{ "name": "user", "type": "address" }],
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "setProfile",
    "inputs": [{ "name": "profileURI", "type": "string" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "totalProfiles",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "ProfileCreated",
    "inputs": [
      { "name": "user", "type": "address", "indexed": true },
      { "name": "profileURI", "type": "string", "indexed": false },
      { "name": "timestamp", "type": "uint256", "indexed": false }
    ]
  },
  {
    "type": "event",
    "name": "ProfileUpdated",
    "inputs": [
      { "name": "user", "type": "address", "indexed": true },
      { "name": "profileURI", "type": "string", "indexed": false },
      { "name": "timestamp", "type": "uint256", "indexed": false }
    ]
  },
  {
    "type": "error",
    "name": "EmptyProfileURI",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ProfileNotFound",
    "inputs": []
  }
] as const;
