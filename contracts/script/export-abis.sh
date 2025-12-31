#!/bin/bash

# Export ABIs from Foundry output to frontend
CONTRACTS_OUT="out"
FRONTEND_ABIS="../frontend/lib/abis"
SUBGRAPH_ABIS="../subgraph/abis"

# Create directories if they don't exist
mkdir -p "$FRONTEND_ABIS"
mkdir -p "$SUBGRAPH_ABIS"

# Extract ABI from Foundry JSON output
extract_abi() {
    local contract=$1
    local source_file="$CONTRACTS_OUT/$contract.sol/$contract.json"

    if [ -f "$source_file" ]; then
        # Extract just the ABI array
        jq '.abi' "$source_file" > "$FRONTEND_ABIS/$contract.json"
        jq '.abi' "$source_file" > "$SUBGRAPH_ABIS/$contract.json"
        echo "Exported $contract ABI"
    else
        echo "Warning: $source_file not found"
    fi
}

# Export all Pumasi contract ABIs
extract_abi "JobFactory"
extract_abi "ApplicationRegistry"
extract_abi "MilestoneManager"
extract_abi "ReviewRegistry"
extract_abi "ArbitrationDAO"

echo "ABI export complete!"
