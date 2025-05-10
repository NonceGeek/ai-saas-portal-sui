"use client";

import { useAutoConnect } from "@/components/AutoConnectProvider";
import { DisplayValue, LabelValueGrid } from "@/components/LabelValueGrid";
import { ThemeToggle } from "@/components/ThemeToggle";
// import { WalletSelector as ShadcnWalletSelector } from "@/components/WalletSelector";
// import { MultiAgent } from "@/components/transactionFlows/MultiAgent";
import { SingleSigner } from "@/components/transactionFlows/SingleSigner";
import { useToast } from "@/components/ui/use-toast";
// import { Sponsor } from "@/components/transactionFlows/Sponsor";
// import { TransactionParameters } from "@/components/transactionFlows/TransactionParameters";
import {
  Card,
  CardContent,
  // CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// s
// import { Switch } from "@/components/ui/switch";
// import { isMainnet } from "@/utils";
import {
  Aptos,
  Network,
  AptosConfig,
  InputGenerateTransactionPayloadData,
} from "@aptos-labs/ts-sdk";
// import { WalletSelector as AntdWalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
// import { WalletConnector as MuiWalletSelector } from "@aptos-labs/wallet-adapter-mui-design";
import {
  AptosChangeNetworkOutput,
  NetworkInfo,
  WalletInfo,
  isAptosNetwork,
  useWallet,
} from "@aptos-labs/wallet-adapter-react";
import { init as initTelegram } from "@telegram-apps/sdk";
import { AlertCircle } from "lucide-react";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { PendingCard, AIAgentCard } from "../uiWrapper/Card";
import { DID_ROOTMUD_URL } from "../lib/utils/constants";

// Imports for registering a browser extension wallet plugin on page load
// import { MyWallet } from "@/utils/standardWallet";
// import { registerWallet } from "@aptos-labs/wallet-standard";

import { NavBar } from "@/components/NavBar";

import {
  AptosWallet,
  ReadonlyUint8Array,
  UserResponseStatus,
} from "@aptos-labs/wallet-standard";

import { WalletButton } from "@/components/wallet/WalletButton";
import { useAptosWallet } from "@razorlabs/wallet-kit";
import { isValidElement } from "react";
import Button from "@mui/material/Button";

// Add this interface declaration at the top of the file, after the imports
declare global {
  interface Window {
    nightly?: {
      aptos: AptosWallet;
    };
  }
}

interface AccountInfo {
  address: {
    data: Uint8Array;
  };
  publicKey: {
    key: {
      data: Uint8Array;
    };
  };
}

// Example of how to register a browser extension wallet plugin.
// Browser extension wallets should call registerWallet once on page load.
// When you click "Connect Wallet", you should see "Example Wallet"
// (function () {
//   if (typeof window === "undefined") return;
//   const myWallet = new MyWallet();
//   registerWallet(myWallet);
// })();

const isTelegramMiniApp =
  typeof window !== "undefined" &&
  (window as any).TelegramWebviewProxy !== undefined;
if (isTelegramMiniApp) {
  initTelegram();
}

async function doGetBalanceByResourceWay(aptos: Aptos, accountAddress: string) {
  const resp = await aptos.getAccountResource({
    accountAddress,
    resourceType: "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>",
  });
  console.log("resp", resp.coin.value);
  return resp;
}

async function doGetBalance(aptos: Aptos, accountAddress: string) {
  const [balance] = await aptos.view({
    payload: {
      function: "0x1::coin::balance",
      typeArguments: ["0x1::aptos_coin::AptosCoin"],
      functionArguments: [accountAddress],
    },
  });
  return balance;
}

// async function buildSimpleTransaction(
//   aptos: Aptos,
//   senderAddress: string,
//   recipientAddress: string,
//   amount: number
// ) {
//   return await aptos.transaction.build.simple({
//     sender: senderAddress,
//     data: {
//       function: "0x1::coin::transfer",
//       typeArguments: ["0x1::aptos_coin::AptosCoin"],
//       functionArguments: [recipientAddress, amount],
//     },
//   });
// }

// Add this helper function near the top of the file
const shortenUuid = (uuid: string) => {
  return `${uuid.slice(0, 2)}...${uuid.slice(-2)}`;
};

export default function Home() {
  // <!-- things about tasks
  const [unsolvedTasks, setUnsolvedTasks] = useState([]);
  const [agents, setAgents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignTaskModalOpen, setIsAssignTaskModalOpen] = useState(false);
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    prompt: "",
    task_type: "llm",
    fee: "",
    fee_unit: "MOVE",
    agent_id: "",
  });

  const [taskRequestApi, setTaskRequestApi] = useState("");

  const [taskId, setTaskId] = useState("");

  // Add this useEffect after other useEffect declarations
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await fetch("https://ai-saas.deno.dev/agents");
        const data = await response.json();
        setAgents(data);
      } catch (error) {
        console.error("Error fetching agents:", error);
        toast.error("Failed to fetch agents");
      }
    };
    const fetchTasks = async () => {
      try {
        const response = await fetch("https://ai-saas.deno.dev/task_unsolved");
        const data = await response.json();
        setUnsolvedTasks(data);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        // toast({
        //   title: "Error",
        //   description: "Failed to fetch tasks"
        // });
      }
    };

    fetchTasks();
    fetchAgents();
  }, []);

  const handleSubmitTask = async (address: string) => {
    try {
      const response = await fetch("https://ai-saas.deno.dev/add_task", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user: address,
          ...taskForm,
        }),
      });
      console.log(
        JSON.stringify({
          user: address,
          ...taskForm,
        })
      );
      if (!response.ok) throw new Error("Failed to submit task" + response);

      toast.success("Task submitted successfully!");
      setIsModalOpen(false);
      const tasksResponse = await fetch(
        "https://ai-saas.deno.dev/task_unsolved"
      );
      const data = await tasksResponse.json();
      setUnsolvedTasks(data);
    } catch (error) {
      console.error("Error submitting task:", error);
      toast.error(
        "Failed to submit task" +
          JSON.stringify({
            user: address,
            ...taskForm,
          })
      );
    }
  };

  // things about tasks -->

  // const {
  //   account,
  //   connected,
  //   network,
  //   wallet,
  //   changeNetwork,
  //   signAndSubmitTransaction,
  // } = useWallet();
  const { connected, disconnect, account, signAndSubmitTransaction, adapter } =
    useAptosWallet();
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);

  // Move these inside useEffect to only run after connection
  // const [adapter, setAdapter] = useState<AptosWallet | null>(null);
  const [aptos, setAptos] = useState<Aptos | null>(null);
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);

  useEffect(() => {
    if (connected) {
      // const nightly = window.nightly?.aptos as AptosWallet;
      // // const nightlyAdapter = nightly?.standardWallet as AptosWallet;
      // console.log("nightlyAdapter", nightly);
      // setAdapter(nightly);

      const aptosConfig = new AptosConfig({
        network: Network.TESTNET,
        fullnode: "https://aptos.testnet.porto.movementlabs.xyz/v1",
      });
      setAptos(new Aptos(aptosConfig));
    }
  }, [connected]);

  useEffect(() => {
    const getNetwork = async () => {
      if (adapter?.network) {
        const network = await adapter.network();
        setNetworkInfo({
          name: network.name,
          chainId: network.chainId.toString(),
          url: network.url,
        });
      }
      if (adapter?.account) {
        const accountInfo = await adapter.account();
        // console.log("accountInfo", accountInfo);
        setAccountInfo(accountInfo as unknown as AccountInfo);
      }
    };

    getNetwork();
  }, [adapter]);

  const getBalance = useCallback(async () => {
    if (!adapter || !aptos) return;
    const account = await adapter.account();
    const balance = await doGetBalance(aptos, account.address.toString());
    toast.success(`Balance: ${balance!.toString()}`);
  }, [aptos, account]);

  const getBalanceByResourceWay = useCallback(async () => {
    if (!adapter || !aptos) return;
    const account = await adapter.account();
    const resp = await doGetBalanceByResourceWay(
      aptos,
      account.address.toString()
    );
    toast.success(`Balance by resource way: ${resp!.coin.value.toString()}`);
  }, [aptos, account]);

  // Example usage within your component:
  const handleTransaction = useCallback(async () => {
    // Docs: https://docs.nightly.app/docs/aptos/solana/connect
    // console.log("info", account, adapter, aptos);
    if (!account?.address) return;
    const network = await adapter?.network();
    // optional: only works if the adapter supports network change.
    if (network?.chainId !== 177) {
      try {
        await adapter?.changeNetwork({ name: Network.TESTNET, chainId: 177 });
      } catch (error) {
        console.error("Failed to change network:", error);
      }
    }
    const aptosConfig = new AptosConfig({
      network: network?.name || Network.TESTNET,
    });
    const aptosClient = new Aptos(aptosConfig);
    const transaction: InputGenerateTransactionPayloadData = {
      function: "0x1::coin::transfer",
      typeArguments: ["0x1::aptos_coin::AptosCoin"],
      functionArguments: [
        "0x960dbc655b847cad38b6dd056913086e5e0475abc27152b81570fd302cb10c38",
        100,
      ],
    };

    const userResponse = await signAndSubmitTransaction({
      payload: transaction,
    });

    if (userResponse.status !== UserResponseStatus.APPROVED) {
      throw new Error(userResponse.status);
    }
    // Confirm withdraw in backend
    const hash = (userResponse as unknown as { args: { hash: string } }).args
      .hash;
    try {
      await aptosClient.waitForTransaction({ transactionHash: hash });
    } catch (error) {
      console.error(error);
    }
    toast.success(`This transaction has been ${userResponse.status}`);
  }, [account]);

  // Add this function near other async functions
  const assignTaskToAgent = async (taskId: string, taskRequestApi: string) => {
    try {
      const response = await fetch(taskRequestApi + "?task_id=" + taskId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("hello world!");
      toast.success("Task assigned successfully!");
      setIsAssignTaskModalOpen(false);
      setTaskId("");

      // Refresh the tasks list
      const tasksResponse = await fetch(
        "https://ai-saas.deno.dev/task_unsolved"
      );
      const tasksData = await tasksResponse.json();
      setUnsolvedTasks(tasksData);
    } catch (error) {
      console.error("Error assigning task:", error);
      toast.error(
        "Failed to assign task to agent: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    }
  };

  return (
    <main className="flex flex-col w-full max-w-[1000px] p-[12px] md:px-8 ">
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <div className="flex justify-between items-center border-b-1 border-yellow-200">
        <a href="http://ai-saas.rootmud.xyz" target="_blank" rel="noreferrer">
          <Image
            src="/logo.png"
            width={64}
            height={64}
            style={{ padding: "12px" }}
            alt="logo"
          />
        </a>
        <div className="flex gap-4 items-center">
          <NavBar />
          <WalletButton />
          <ThemeToggle />
        </div>
      </div>
      <p className="text-3xl lg:text-6xl mt-12 mb-6 h-36 lg:h-48 rounded-lg text-center">
        <p className="text-3xl lg:text-6xl font-bold">
          Leverage AI agents as your business workforce
        </p>
        <p className="text-2xl lg:text-4xl pt-[20px] pl-[20px] pr-[20px] text-gray-400">
          Assign each an on-chain identity {`</>`}
        </p>
      </p>
      {/* TODO: copy the things in basicContainer to here */}
      <div className="w-full flex-shrink-0">
        <center>
          <h3 className="text-3xl font-semibold mb-4 mt-6">Data Panel</h3>
        </center>
        <div className="w-full grid grid-cols-3 gap-4 mb-4 text-center">
          <Card className="bg-yellow-50 dark:bg-yellow-600">
            <CardHeader>
              <CardTitle className="text-sm lg:text-lg">Agent Alive</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{agents.length.toString()}</p>
            </CardContent>
          </Card>
          <Card className="bg-yellow-50 dark:bg-yellow-600">
            <CardHeader>
              <CardTitle className="text-sm lg:text-lg">Total Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {(unsolvedTasks.length + 6).toString()}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-yellow-50 dark:bg-yellow-600">
            <CardHeader>
              <CardTitle className="text-sm lg:text-lg">
                Unsolved Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {unsolvedTasks.length.toString()}
              </p>
            </CardContent>
          </Card>
        </div>
        {/* TODO: copy the things in basicContainer about Unsolved Tasks Stack Here. */}
      </div>
      <div className="w-full mt-16">
        <div className="w-full flex-shrink-0">
          <center>
            <h3 className="text-xl md:text-2xl font-semibold mb-4">
              Unsolved Tasks Stack
            </h3>
          </center>

          <div className="w-full flex flex-wrap justify-center gap-4 mb-4">
            {unsolvedTasks.map((task: any) => (
              <div
                key={task.unique_id}
                className="w-full md:w-1/2 lg:w-1/3 xl:w-1/4"
              >
                <PendingCard
                  id={task?.id}
                  user={task?.user}
                  task_type={task?.task_type}
                  prompt={task?.prompt}
                  fee={task?.fee}
                  fee_unit={task?.fee_unit}
                  created_at={task?.created_at}
                  unique_id={task?.unique_id}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full flex justify-center">
        {connected ? (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
          >
            Submit New Task
          </button>
        ) : (
          <button
            disabled
            className="bg-gray-400 text-white px-6 py-2 rounded cursor-not-allowed"
          >
            Connect Wallet to Submit Task
          </button>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-[500px]">
            <h3 className="text-2xl font-semibold mb-4">Submit New Task</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Task Type
                </label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-blue-500"
                  value={taskForm.task_type}
                  onChange={(e) =>
                    setTaskForm({ ...taskForm, task_type: e.target.value })
                  }
                  disabled={!!taskForm.agent_id}
                >
                  <option value="llm">LLM</option>
                  <option value="img">IMG</option>
                  <option value="trade">TRADE</option>
                </select>
                {taskForm.agent_id && (
                  <p className="mt-1 text-sm text-gray-500">
                    Task type is locked to match agent capabilities
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Task Description
                </label>
                <textarea
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-blue-500"
                  rows={4}
                  value={taskForm.prompt}
                  onChange={(e) =>
                    setTaskForm({ ...taskForm, prompt: e.target.value })
                  }
                  placeholder={
                    taskForm.agent_id
                      ? "Describe your task for this specific agent..."
                      : "Describe your task..."
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Fee (Optional)
                </label>
                <input
                  type="number"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-blue-500"
                  value={taskForm.fee}
                  onChange={(e) =>
                    setTaskForm({ ...taskForm, fee: e.target.value })
                  }
                />
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-blue-500"
                  value={taskForm.fee_unit}
                  onChange={(e) =>
                    setTaskForm({ ...taskForm, fee_unit: e.target.value })
                  }
                >
                  <option value="MOVE">MOVE</option>
                  <option value="USDC">USDC</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setTaskForm({
                    prompt: "",
                    task_type: "llm",
                    fee: "",
                    fee_unit: "MOVE",
                    agent_id: "",
                  });
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (account?.address) {
                    handleSubmitTask(account.address);
                  } else {
                    toast.error("Please connect your wallet first");
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TODO: copy the AI Agents part in basicContainer to here */}
      <center>
        <h3 className="text-3xl font-semibold mt-16 mb-4">AI Agents</h3>
      </center>

      <div className="w-full flex flex-wrap justify-center gap-4 mb-4">
        {agents.map((agent: any) => (
          <div
            key={agent.unique_id}
            className="w-full md:w-1/2 lg:w-1/3 xl:w-1/4"
          >
            <AIAgentCard
              description={agent.description}
              type={agent.type}
              addr={agent.addr}
              owner_addr={agent.owner_addr}
              unique_id={agent.unique_id}
              chat_url={agent.chat_url}
              assignTaskDom={
                <Button
                  style={{ marginTop: "10px" }}
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    setIsAssignTaskModalOpen(true);
                    setTaskRequestApi(agent.task_request_api);
                  }}
                >
                  Assign Task
                </Button>
              }
            />
          </div>
        ))}
      </div>

      <div className="w-full flex justify-center">
        <button
          onClick={() => setIsAgentModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
        >
          New Agent Register Guide
        </button>
      </div>

      {isAssignTaskModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-[500px]">
            <h3 className="text-2xl font-semibold mb-4 text-black dark:text-white">
              Assign Task to This Agent
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Task Id
              </label>
              <textarea
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-blue-500"
                rows={1}
                value={taskId}
                onChange={(e) => setTaskId(e.target.value)}
              />
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => assignTaskToAgent(taskId, taskRequestApi)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled={!taskId.trim()}
              >
                Request
              </button>
              <button
                onClick={() => setIsAssignTaskModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isAgentModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-[500px]">
            <h3 className="text-2xl font-semibold mb-4">
              How to Register Your AI Agent
            </h3>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-md">
                <p className="font-medium mb-2">Step 1:</p>
                <p className="flex items-center">
                  Git Clone The Template From:
                  <a
                    href="https://github.com/NonceGeek/tai-shang-micro-ai-saas/tree/main/agents"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-blue-600 hover:underline"
                  >
                    Templates
                  </a>
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-md">
                <p className="font-medium mb-2">Step 2:</p>
                <p>Deploy AI Agent on Deno</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-md">
                <p className="font-medium mb-2">Step3:</p>
                <p>Run Register with Agent: https://YOUR_AGENT_URL/register</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-md">
                <p className="font-medium mb-2">Step4:</p>
                <p>
                  Give Agent a MoveDID:{" "}
                  <a
                    href={DID_ROOTMUD_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    DID Manager
                  </a>
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsAgentModalOpen(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* <div className="flex justify-between gap-6 pb-10">
        
        <div className="flex flex-col gap-2 md:gap-3">
          <h1 className="text-xl sm:text-3xl font-semibold tracking-tight">
            Scaffold Movement
            {network?.name ? ` — ${network.name}` : ""}
          </h1>
          <a
            href="https://github.com/aptos-labs/aptos-wallet-adapter/tree/main/apps/nextjs-example"
            target="_blank"
            rel="noreferrer"
            className="text-sm text-muted-foreground underline underline-offset-2 font-medium leading-none"
          >
            Demo App Source Code
          </a>
        </div>
      </div> */}
      {/* {connected && isMainnet(connected, network?.name) && (
        <Alert variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>
            The transactions flows below will not work on the Mainnet network.
          </AlertDescription>
        </Alert>
      )} */}
      {connected && (
        <>
          {/* <SingleSigner /> */}
          {/* <TransactionParameters />
          <Sponsor />
          <MultiAgent /> */}
        </>
      )}
      <footer className="mt-auto text-center py-4 text-gray-600">
        Powered by DIMSUM AI Lab@2025
      </footer>
    </main>
  );
}

interface WalletConnectionProps {
  account: AccountInfo | null;
  network: NetworkInfo | null;
  wallet: WalletInfo | null;
}

function WalletConnection({ account, network, wallet }: WalletConnectionProps) {
  const isValidNetworkName = () => {
    if (network && isAptosNetwork(network)) {
      return Object.values<string | undefined>(Network).includes(network?.name);
    }
    return true;
  };

  const isNetworkChangeSupported = wallet?.name === "Nightly";

  // Add function to handle address conversion
  const getAddressString = () => {
    if (!account?.address) return null;

    try {
      if (typeof account.address === "object" && "data" in account.address) {
        const addressData = account.address.data;
        return Object.values(addressData)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
      }

      if (typeof account.address === "string") {
        return account.address;
      }

      return null;
    } catch (error) {
      console.error("Error processing address:", error);
      return null;
    }
  };

  const getPublicKeyString = () => {
    if (!account?.publicKey) return null;

    try {
      if (typeof account.publicKey === "object" && "key" in account.publicKey) {
        const keyData = account.publicKey.key.data;
        return Object.values(keyData)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
      }

      return null;
    } catch (error) {
      console.error("Error processing public key:", error);
      return null;
    }
  };

  const address = getAddressString();
  const publicKey = getPublicKeyString();

  const items = [
    {
      label: "Address",
      value: (
        <DisplayValue
          value={address ? "0x" + address : "Not Present"}
          isCorrect={!!address}
        />
      ),
    },
    {
      label: "Public key",
      value: (
        <DisplayValue
          value={publicKey ? "0x" + publicKey : "Not Present"}
          isCorrect={!!publicKey}
        />
      ),
    },
    {
      label: "ANS name",
      subLabel: "(only if attached)",
      value: "Not Present",
    },
    {
      label: "Min keys required",
      subLabel: "(only for multisig)",
      value: "Not Present",
    },
  ];

  // Debug logs
  // console.log('=== Debug Info ===');
  // console.log('Account:', JSON.stringify(account, null, 2));
  // console.log('Network:', JSON.stringify(network, null, 2));
  // console.log('Wallet:', JSON.stringify(wallet, null, 2));

  // console.log('Processed address:', address);
  // console.log('Processed publicKey:', publicKey);

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Wallet Connection</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-10 pt-6">
          <div className="flex flex-col gap-6">
            <h4 className="text-lg font-medium">Wallet Details</h4>
            <LabelValueGrid
              items={[
                {
                  label: "Icon",
                  value: wallet?.icon ? (
                    <Image
                      src={wallet.icon}
                      alt={wallet.name}
                      width={24}
                      height={24}
                    />
                  ) : (
                    "Not Present"
                  ),
                },
                {
                  label: "Name",
                  value: wallet?.name ?? "Not Present",
                },
                {
                  label: "URL",
                  value: wallet?.url ? (
                    <a
                      href={wallet.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 dark:text-blue-300"
                    >
                      {wallet.url}
                    </a>
                  ) : (
                    "Not Present"
                  ),
                },
              ]}
            />
          </div>

          <div className="flex flex-col gap-6">
            <h4 className="text-lg font-medium">Account Info</h4>
            <LabelValueGrid items={items} />
          </div>

          <div className="flex flex-col gap-6">
            <h4 className="text-lg font-medium">Network Info</h4>
            <LabelValueGrid
              items={[
                {
                  label: "Network name",
                  value: (
                    <DisplayValue
                      value={network?.name ?? "Not Present"}
                      isCorrect={isValidNetworkName()}
                      expected={Object.values<string>(Network).join(", ")}
                    />
                  ),
                },
                {
                  label: "URL",
                  value: network?.url ? (
                    <a
                      href={network.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 dark:text-blue-300"
                    >
                      {network.url}
                    </a>
                  ) : (
                    "Not Present"
                  ),
                },
                {
                  label: "Chain ID",
                  value: network?.chainId ?? "Not Present",
                },
              ]}
            />
          </div>

          {/* <div className="flex flex-col gap-6">
          <h4 className="text-lg font-medium">Change Network</h4>
          <RadioGroup
            value={network?.name}
            orientation="horizontal"
            className="flex gap-6"
            onValueChange={(value: Network) => changeNetwork(value)}
            disabled={!isNetworkChangeSupported}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={Network.DEVNET} id="devnet-radio" />
              <Label htmlFor="devnet-radio">Devnet</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={Network.TESTNET} id="testnet-radio" />
              <Label htmlFor="testnet-radio">Testnet</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={Network.MAINNET} id="mainnet-radio" />
              <Label htmlFor="mainnet-radio">Mainnet</Label>
            </div>
          </RadioGroup>
          {!isNetworkChangeSupported && (
            <div className="text-sm text-red-600 dark:text-red-400">
              * {wallet?.name ?? "This wallet"} does not support network change
              requests
            </div>
          )}
        </div> */}
        </CardContent>
      </Card>
    </div>
  );
}
