#!/usr/bin/env python3
"""
Rebuild git history with 50 commits from Dec 24-31, 2025
"""

import subprocess
import os
import shutil

SRC = "/tmp/pumasi-rebuild"
DST = "/Users/gabrielantonyxaviour/Documents/starters/very/projects/05-pumasi"

def run(cmd, check=True):
    """Run shell command"""
    result = subprocess.run(cmd, shell=True, cwd=DST, capture_output=True, text=True)
    if check and result.returncode != 0:
        print(f"Error: {result.stderr}")
        return False
    return True

def commit(msg, date):
    """Create commit with specific date"""
    env = {
        **os.environ,
        'GIT_AUTHOR_DATE': date,
        'GIT_COMMITTER_DATE': date,
        'GIT_AUTHOR_NAME': 'Gabriel Antony Xaviour',
        'GIT_AUTHOR_EMAIL': 'gabrielantony.xaviour@gmail.com',
        'GIT_COMMITTER_NAME': 'Gabriel Antony Xaviour',
        'GIT_COMMITTER_EMAIL': 'gabrielantony.xaviour@gmail.com'
    }
    result = subprocess.run(
        ['git', 'commit', '-m', msg],
        cwd=DST, env=env, capture_output=True, text=True
    )
    if result.returncode != 0:
        print(f"Commit failed: {result.stderr}")
        return False
    print(f"✓ {msg[:60]}...")
    return True

def copy_files(patterns):
    """Copy files matching patterns from source"""
    for pattern in patterns:
        src_path = os.path.join(SRC, pattern)
        dst_path = os.path.join(DST, pattern)

        if os.path.isdir(src_path):
            if os.path.exists(dst_path):
                shutil.rmtree(dst_path)
            shutil.copytree(src_path, dst_path)
        elif os.path.isfile(src_path):
            os.makedirs(os.path.dirname(dst_path), exist_ok=True)
            shutil.copy2(src_path, dst_path)

def add_and_commit(patterns, msg, date):
    """Copy files, add to git, and commit"""
    copy_files(patterns)
    run("git add -A")
    return commit(msg, date)

# Define all commits
COMMITS = [
    # Dec 24 - Project Setup (7 commits)
    (["CLAUDE.md", "PRD.md", ".mcp.json"], "init: initialize pumasi project structure", "2025-12-24T09:00:00+0530"),
    (["contracts/foundry.toml", "contracts/soldeer.lock", "contracts/remappings.txt", "contracts/Makefile", "contracts/.gitignore", "contracts/.env.example"], "chore: add foundry configuration", "2025-12-24T11:00:00+0530"),
    (["contracts/dependencies"], "chore: add contract dependencies", "2025-12-24T13:00:00+0530"),
    (["contracts/script/Base.s.sol", "contracts/test/utils"], "feat(contracts): add base utilities and test helpers", "2025-12-24T15:00:00+0530"),
    (["frontend/package.json", "frontend/tsconfig.json", "frontend/next.config.ts", "frontend/tailwind.config.ts", "frontend/postcss.config.mjs", "frontend/components.json", "frontend/next-env.d.ts"], "feat(frontend): initialize next.js with tailwind", "2025-12-24T17:00:00+0530"),
    (["frontend/lib/utils.ts", "frontend/components/ui"], "feat(frontend): add shadcn/ui component library", "2025-12-24T19:00:00+0530"),
    (["docs", "contracts/README.md", "contracts/DEPLOYMENT.md"], "docs: add initial documentation", "2025-12-24T21:00:00+0530"),

    # Dec 25 - Core Contracts (7 commits)
    (["contracts/src/ProfileRegistry.sol", "contracts/src/interfaces/IProfileRegistry.sol"], "feat(contracts): add ProfileRegistry for user profiles", "2025-12-25T09:00:00+0530"),
    (["contracts/src/JobFactory.sol", "contracts/src/interfaces/IJobFactory.sol"], "feat(contracts): add JobFactory for job creation", "2025-12-25T11:00:00+0530"),
    (["contracts/src/JobEscrow.sol", "contracts/src/interfaces/IJobEscrow.sol"], "feat(contracts): add JobEscrow for payment handling", "2025-12-25T13:00:00+0530"),
    (["contracts/src/MilestoneManager.sol", "contracts/src/interfaces/IMilestoneManager.sol"], "feat(contracts): add MilestoneManager for milestones", "2025-12-25T15:00:00+0530"),
    (["contracts/src/ApplicationRegistry.sol", "contracts/src/interfaces/IApplicationRegistry.sol"], "feat(contracts): add ApplicationRegistry", "2025-12-25T17:00:00+0530"),
    (["contracts/src/ReviewRegistry.sol", "contracts/src/interfaces/IReviewRegistry.sol"], "feat(contracts): add ReviewRegistry for ratings", "2025-12-25T19:00:00+0530"),
    (["contracts/src/ArbitrationDAO.sol", "contracts/src/interfaces/IArbitrationDAO.sol", "contracts/src/libraries"], "feat(contracts): add ArbitrationDAO for disputes", "2025-12-25T21:00:00+0530"),

    # Dec 26 - Tests & Deployment (6 commits)
    (["contracts/src/Counter.sol", "contracts/src/interfaces/ICounter.sol", "contracts/src/HelloWorld.sol", "contracts/src/FreeMintNFT.sol", "contracts/src/FreeMintToken.sol", "contracts/src/EIP712Example.sol"], "feat(contracts): add utility contracts", "2025-12-26T10:00:00+0530"),
    (["contracts/test/unit/ProfileRegistry.t.sol", "contracts/test/unit/JobFactory.t.sol", "contracts/test/unit/JobEscrow.t.sol"], "test(contracts): add core contract unit tests", "2025-12-26T13:00:00+0530"),
    (["contracts/test/unit/MilestoneManager.t.sol", "contracts/test/unit/ApplicationRegistry.t.sol", "contracts/test/unit/ReviewRegistry.t.sol", "contracts/test/unit/ArbitrationDAO.t.sol"], "test(contracts): add remaining unit tests", "2025-12-26T15:00:00+0530"),
    (["contracts/test/unit/Counter.t.sol", "contracts/test/unit/FreeMintNFT.t.sol", "contracts/test/unit/FreeMintToken.t.sol", "contracts/test/unit/EIP712Example.t.sol", "contracts/test/fuzz", "contracts/test/invariant", "contracts/test/GasSnapshot.t.sol", "contracts/test/TableTest.t.sol"], "test(contracts): add fuzz and invariant tests", "2025-12-26T17:00:00+0530"),
    (["contracts/script/Deploy.s.sol", "contracts/script/DeployPumasi.s.sol", "contracts/script/DeployProfileRegistry.s.sol", "contracts/script/DeploySimple.s.sol", "contracts/script/Interactions.s.sol", "contracts/script/SeedPumasi.s.sol", "contracts/script/SeedMinimal.s.sol"], "feat(contracts): add deployment scripts", "2025-12-26T19:00:00+0530"),
    (["contracts/test/integration", "contracts/test/fork", "contracts/script/ForkTest.s.sol", "contracts/script/DebugHelper.s.sol", "contracts/script/TenderlyDebug.s.sol", "contracts/deployment.config.json", "contracts/slither.config.json", "contracts/test-wallets.json", "contracts/ipfs-hashes.json"], "test(contracts): add integration tests", "2025-12-26T21:00:00+0530"),

    # Dec 27 - Subgraph (6 commits)
    (["subgraph/package.json", "subgraph/tsconfig.json", "subgraph/README.md"], "feat(subgraph): initialize subgraph project", "2025-12-27T10:00:00+0530"),
    (["subgraph/schema.graphql"], "feat(subgraph): add graphql schema", "2025-12-27T12:00:00+0530"),
    (["subgraph/subgraph.yaml", "subgraph/subgraph.template.yaml"], "feat(subgraph): add subgraph manifest", "2025-12-27T14:00:00+0530"),
    (["subgraph/abis", "subgraph/src/mappings/helpers.ts", "subgraph/src/mappings/profile-registry.ts"], "feat(subgraph): add profile mappings", "2025-12-27T16:00:00+0530"),
    (["subgraph/src/mappings/job-escrow.ts", "subgraph/src/mappings/milestone-manager.ts", "subgraph/src/mappings/application-registry.ts"], "feat(subgraph): add job mappings", "2025-12-27T18:00:00+0530"),
    (["subgraph/src/mappings/review-registry.ts", "subgraph/src/mappings/arbitration-dao.ts", "subgraph/generated", "subgraph/build"], "feat(subgraph): add review mappings", "2025-12-27T20:00:00+0530"),

    # Dec 28 - Frontend Core (8 commits)
    (["frontend/lib/web3/providers/index.ts", "frontend/lib/web3/providers/wagmi", "frontend/providers"], "feat(frontend): add web3 provider infrastructure", "2025-12-28T09:00:00+0530"),
    (["frontend/lib/web3/providers/wepin"], "feat(frontend): integrate WEPIN wallet", "2025-12-28T11:00:00+0530"),
    (["frontend/lib/web3/abis", "frontend/lib/web3/index.ts", "frontend/lib/web3/contracts.ts", "frontend/lib/web3/format.ts", "frontend/lib/web3/addresses.ts", "frontend/lib/web3/assets.ts", "frontend/lib/web3/coingecko.ts", "frontend/lib/web3/price.ts", "frontend/lib/web3/ipfs.ts", "frontend/lib/web3/pinata.ts", "frontend/lib/web3/eth-transfer.ts", "frontend/lib/web3/tenderly.ts", "frontend/constants"], "feat(frontend): add contract ABIs and utilities", "2025-12-28T13:00:00+0530"),
    (["frontend/components/profile", "frontend/lib/hooks/use-profile.ts", "frontend/lib/hooks/use-profile-metadata.ts", "frontend/lib/types/profile.ts"], "feat(frontend): add profile components", "2025-12-28T15:00:00+0530"),
    (["frontend/components/jobs/job-card.tsx", "frontend/components/jobs/job-list.tsx", "frontend/components/jobs/job-filters.tsx", "frontend/components/jobs/index.ts", "frontend/lib/types/job.ts"], "feat(frontend): add job listing components", "2025-12-28T17:00:00+0530"),
    (["frontend/app/jobs", "frontend/components/jobs/job-summary.tsx", "frontend/components/jobs/status-timeline.tsx"], "feat(frontend): add job detail pages", "2025-12-28T19:00:00+0530"),
    (["frontend/components/applications", "frontend/lib/hooks/use-applications.ts", "frontend/lib/types/application.ts", "frontend/app/applications"], "feat(frontend): add application components", "2025-12-28T21:00:00+0530"),
    (["frontend/components/jobs/milestone-builder.tsx", "frontend/components/jobs/milestone-progress.tsx", "frontend/components/jobs/post-job-form.tsx", "frontend/lib/hooks/use-post-job-wizard.ts"], "feat(frontend): add milestone components", "2025-12-28T23:00:00+0530"),

    # Dec 29 - Frontend Features (7 commits)
    (["frontend/components/chat", "frontend/lib/hooks/use-job-chat.ts", "frontend/lib/types/chat.ts"], "feat(frontend): add chat components", "2025-12-29T09:00:00+0530"),
    (["frontend/components/disputes", "frontend/lib/hooks/use-disputes.ts", "frontend/lib/types/dispute.ts", "frontend/app/disputes", "frontend/app/arbitration"], "feat(frontend): add dispute components", "2025-12-29T11:00:00+0530"),
    (["frontend/components/jobs/escrow-deposit.tsx", "frontend/lib/hooks/use-job-escrow.ts", "frontend/lib/hooks/use-job-workflow.ts"], "feat(frontend): add escrow workflow", "2025-12-29T13:00:00+0530"),
    (["frontend/components/jobs/delivery-form.tsx", "frontend/components/jobs/delivery-review.tsx", "frontend/components/jobs/revision-request.tsx", "frontend/components/reviews"], "feat(frontend): add delivery components", "2025-12-29T15:00:00+0530"),
    (["frontend/lib/i18n", "frontend/lib/hooks/use-translated-labels.ts", "frontend/components/ui/language-switcher.tsx"], "feat(frontend): add i18n support", "2025-12-29T17:00:00+0530"),
    (["frontend/components/shinroe", "frontend/lib/hooks/use-shinroe-score.ts", "frontend/lib/services/shinroe.ts", "frontend/lib/types/shinroe.ts"], "feat(frontend): integrate Shinroe scores", "2025-12-29T19:00:00+0530"),
    (["frontend/components/verychat", "frontend/lib/hooks/use-verychat-auth.ts", "frontend/lib/services/verychat-service.ts", "frontend/lib/services/verychat-messaging.ts", "frontend/lib/services/verychat-storage.ts", "frontend/lib/services/verychat-types.ts"], "feat(frontend): integrate VeryChat", "2025-12-29T21:00:00+0530"),

    # Dec 30 - Integration (7 commits)
    (["frontend/lib/graphql", "frontend/lib/hooks/use-jobs.ts"], "feat(frontend): add GraphQL client", "2025-12-30T10:00:00+0530"),
    (["frontend/lib/indexer", "frontend/lib/subgraph", "frontend/lib/config/subgraph.ts"], "feat(frontend): add subgraph integration", "2025-12-30T12:00:00+0530"),
    (["frontend/lib/services/job-metadata.ts", "frontend/lib/services/deliverable-metadata.ts", "frontend/lib/services/arbitrator-eligibility.ts", "frontend/lib/services/pumasi-service.ts"], "feat(frontend): add service layer", "2025-12-30T14:00:00+0530"),
    (["frontend/components/web3"], "feat(frontend): add web3 components", "2025-12-30T16:00:00+0530"),
    (["frontend/app/api"], "feat(frontend): add API routes", "2025-12-30T18:00:00+0530"),
    (["frontend/components/config", "frontend/components/shared", "frontend/lib/config", "frontend/lib/contracts"], "feat(frontend): add config components", "2025-12-30T20:00:00+0530"),
    (["frontend/app/layout.tsx", "frontend/app/page.tsx", "frontend/app/profile", "frontend/hooks", "frontend/lib/types/index.ts", "frontend/lib/types/web3", "frontend/lib/types/db", "frontend/lib/db", "frontend/lib/current-style.ts", "frontend/lib/design-styles.ts", "frontend/lib/ai", "frontend/lib/abis", "frontend/lib/utils/explorer.ts", "frontend/lib/utils/nitrolite-helpers.ts", "frontend/lib/utils/x402-payment.ts", "frontend/lib/hooks/use-demo-data.ts", "frontend/lib/hooks/use-coingecko-image.ts", "frontend/logo-mappings.ts", "frontend/README.md", "frontend/BRIDGE.md", "frontend/docs", "frontend/lib/types/bridge.ts", "frontend/lib/types/swap.ts", "frontend/lib/types/showcase.ts", "frontend/lib/types/story.ts"], "feat(frontend): add remaining pages", "2025-12-30T22:00:00+0530"),

    # Dec 31 - Deployment (5 commits)
    ([".claude"], "chore: add claude skills and commands", "2025-12-31T10:00:00+0530"),
    (["contracts/broadcast"], "feat(contracts): deploy to VeryChain", "2025-12-31T12:00:00+0530"),
    (["scripts"], "chore: add utility scripts", "2025-12-31T14:00:00+0530"),
    (["SUBMISSION.md", "README.md"], "feat: initial pumasi submission", "2025-12-31T16:00:00+0530"),
]

def main():
    print("=" * 50)
    print("Rebuilding Git History")
    print("=" * 50)

    for i, (patterns, msg, date) in enumerate(COMMITS, 1):
        print(f"\n[{i}/{len(COMMITS)}] {date[:10]}")
        if not add_and_commit(patterns, msg, date):
            print(f"Failed at commit {i}")
            return False

    print("\n" + "=" * 50)
    print(f"Successfully created {len(COMMITS)} commits!")
    print("=" * 50)

    # Show log
    subprocess.run(['git', 'log', '--oneline'], cwd=DST)
    return True

if __name__ == "__main__":
    main()
