# AI SaaS SUI Smart Contract

> https://suiscan.xyz/testnet/object/0x2fe222b72d0d1b09a635ba733aa023a752bf4beec007e1bc0e24c5f86619f31b/tx-blocks

Bash Command:

```
brew install sui
brew upgrade sui

# get faucet.


sui move build
sui client gas
sui client object [object_id] --json
sui client publish ./ -gas-budget 4000000000 --skip-dependency-verification

```

## Function Call

Here are the Sui client commands for all the entry functions in your ai-saas module with your package ID:

### 1. create_task
```bash
sui client call --package 0x2fe222b72d0d1b09a635ba733aa023a752bf4beec007e1bc0e24c5f86619f31b --module ai_saas --function create_task \
  --args "<AGENT_ID>" "Write a blog post about Sui" "content_creation" 100 \
  --gas-budget 10000000
```

### 2. assign_task
```bash
sui client call --package 0x2fe222b72d0d1b09a635ba733aa023a752bf4beec007e1bc0e24c5f86619f31b --module ai_saas --function assign_task \
  --args "<TASK_OBJECT_ID>" "<AGENT_OBJECT_ID>" \
  --gas-budget 10000000
```

### 3. cancel_task
```bash
sui client call --package 0x2fe222b72d0d1b09a635ba733aa023a752bf4beec007e1bc0e24c5f86619f31b --module ai_saas --function cancel_task \
  --args "<TASK_OBJECT_ID>" \
  --gas-budget 10000000
```

### 4. solve_task
```bash
sui client call --package 0x2fe222b72d0d1b09a635ba733aa023a752bf4beec007e1bc0e24c5f86619f31b --module ai_saas --function solve_task \
  --args "<TASK_OBJECT_ID>" "Here is the completed solution..." "<AGENT_OBJECT_ID>" \
  --gas-budget 10000000
```

### 5. pay_for_task
```bash
sui client call --package 0x2fe222b72d0d1b09a635ba733aa023a752bf4beec007e1bc0e24c5f86619f31b --module ai_saas --function pay_for_task \
  --args "<TASK_OBJECT_ID>" "<AGENT_OBJECT_ID>" "<COIN_OBJECT_ID>" \
  --gas-budget 10000000
```

### 6. create_agent
```bash
sui client call --package 0x2fe222b72d0d1b09a635ba733aa023a752bf4beec007e1bc0e24c5f86619f31b --module ai_saas --function create_agent \
  --args "Claude" "AI assistant for writing tasks" "text" "https://api.anthropic.com" "https://claude.ai" \
  --gas-budget 10000000
```

### 7. update_agent
```bash
sui client call --package 0x2fe222b72d0d1b09a635ba733aa023a752bf4beec007e1bc0e24c5f86619f31b --module ai_saas --function update_agent \
  --args "<AGENT_OBJECT_ID>" "Updated Name" "Updated Description" "updated_type" "https://new-api-url.com" "https://new-chat-url.com" \
  --gas-budget 10000000
```

### Notes:

1. Replace placeholders in `<ANGLE_BRACKETS>` with actual object IDs from your wallet/blockchain
2. For string arguments with spaces, keep the quotes
3. For `solve_task` with long solutions, you can use a file:
   ```bash
   sui client call --package 0x2fe222b72d0d1b09a635ba733aa023a752bf4beec007e1bc0e24c5f86619f31b --module ai_saas --function solve_task \
     --args "<TASK_OBJECT_ID>" @solution.txt "<AGENT_OBJECT_ID>" \
     --gas-budget 10000000
   ```
   Where solution.txt contains your solution text

4. To find object IDs in your wallet:
   ```bash
   sui client objects
   ```

5. To view details of a specific object:
   ```bash
   sui client object <OBJECT_ID>
   ```

These commands should allow you to interact with all the entry functions in your AI SaaS module.

## Guides

* [Sui 极速上手 | Move dApp 极速入门（拾贰）](https://mp.weixin.qq.com/s/jrz3p9x495HpAvQEYRNiZw)