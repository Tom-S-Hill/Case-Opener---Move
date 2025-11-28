import { useState } from "react";
import {
  ConnectButton,
  useCurrentAccount,
  useSuiClient,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";

const PACKAGE_ID =
  "0xe259ae9e0ed8ffdca328add794eb3c58f0e7d88c8e0e779339aaaa3e46bfe5e2";

// Rarity labels for SKIN objects
const RARITY_LABELS: Record<number, string> = {
  1: "Common",
  2: "Rare",
  3: "Epic",
  4: "Legendary",
};

const CASE_IMAGE = "/images/case.png";

const SKIN_IMAGES_BY_RARITY: Record<number, string> = {
  1: "/images/common_item.png",
  2: "/images/rare_item.png",
  3: "/images/epic_item.png",
  4: "/images/legendary_item.png",
};

export default function App() {
  const account = useCurrentAccount();
  const client = useSuiClient();

  const { mutateAsync: signAndExecuteTransaction } =
    useSignAndExecuteTransaction();

  const [cases, setCases] = useState<any[]>([]);
  const [skins, setSkins] = useState<any[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  // 🔹 Load both cases and skins in one go
  async function loadInventory() {
    if (!account) return;

    const [casesRes, skinsRes] = await Promise.all([
      client.getOwnedObjects({
        owner: account.address,
        filter: { StructType: `${PACKAGE_ID}::case_opener::Case` },
        options: { showContent: true },
      }),
      client.getOwnedObjects({
        owner: account.address,
        filter: { StructType: `${PACKAGE_ID}::case_opener::Skin` },
        options: { showContent: true },
      }),
    ]);

    setCases(casesRes.data);
    setSkins(skinsRes.data);
  }

  async function deleteSkin(skinId: string) {
    if (!account) {
      alert("Please connect wallet first");
      return;
    }

    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::case_opener::delete_skin`,
      arguments: [tx.object(skinId)],
    });

    await signAndExecuteTransaction({
      transaction: tx,
      chain: "sui:testnet",
    });

    // Reload inventory to show it is deleted
    await loadInventory();
  }

  async function createCase() {
    if (!account) {
      alert("Connect wallet first");
      return;
    }

    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::case_opener::create_case`,
    });

    await signAndExecuteTransaction({
      transaction: tx,
      chain: "sui:testnet",
    });

    await loadInventory();
  }

  async function openSelectedCase() {
    if (!account) {
      alert("Connect wallet first");
      return;
    }
    if (!selectedCaseId) {
      alert("Select a case first");
      return;
    }

    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::case_opener::open_case`,
      arguments: [tx.object(selectedCaseId), tx.object("0x8")],
    });

    await signAndExecuteTransaction({
      transaction: tx,
      chain: "sui:testnet",
    });

    setSelectedCaseId(null);
    await loadInventory();
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center py-8">
      <h1 className="text-3xl font-bold mb-4">Case Opener</h1>

      <ConnectButton />

      {account && (
        <div className="mt-4 flex gap-3">
          <button
            className="bg-blue-600 px-4 py-2 rounded"
            onClick={createCase}
          >
            Mint Case
          </button>
          <button
            className="bg-purple-600 px-4 py-2 rounded"
            onClick={loadInventory}
          >
            Refresh Inventory
          </button>
          <button
            className="bg-yellow-500 px-4 py-2 rounded disabled:opacity-50"
            disabled={!selectedCaseId}
            onClick={openSelectedCase}
          >
            Open Selected Case
          </button>
        </div>
      )}

      {/* CASES */}
      {account && (
        <div className="mt-8 w-full max-w-4xl">
          <h2 className="text-xl font-semibold mb-2 text-center">Your Cases</h2>
          {cases.length === 0 && (
            <p className="text-center text-sm text-slate-300">
              No cases yet. Mint one to get started.
            </p>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {cases.map((obj) => {
              const id = obj.data?.objectId as string | undefined;
              if (!id) return null;

              const isSelected = id === selectedCaseId;

              return (
                <div
                  key={id}
                  onClick={() => setSelectedCaseId(id)}
                  className={`border rounded-lg p-3 text-xs cursor-pointer bg-slate-800 hover:bg-slate-700 transition ${
                    isSelected ? "ring-2 ring-yellow-400" : ""
                  }`}
                >
                  <div className="h-44 mb-2 rounded bg-slate-700 flex items-center justify-center overflow-hidden">
                    <img
                      src={CASE_IMAGE}
                      alt="Case"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="break-all">
                    <span className="font-semibold">ID:</span> {id}
                  </div>
                  <div className="mt-1 italic text-slate-300">
                    {isSelected
                      ? "Selected"
                      : "Click to select this case to open"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SKINS / ITEMS */}
      {account && (
        <div className="mt-10 w-full max-w-4xl">
          <h2 className="text-xl font-semibold mb-2 text-center">Your Skins</h2>
          {skins.length === 0 && (
            <p className="text-center text-sm text-slate-300">
              You haven&apos;t unboxed any skins yet.
            </p>
          )}
          <div className="grid grid-cols-4 md:grid-cols-4 gap-4">
            {skins.map((obj) => {
              const id = obj.data?.objectId as string | undefined;
              if (!id) return null;

              const fields = obj.data?.content?.fields as any;
              const rarityNum: number | undefined = fields?.rarity;
              const rarityLabel =
                rarityNum !== undefined
                  ? RARITY_LABELS[rarityNum] ?? `Rarity ${rarityNum}`
                  : "Unknown";

              const imgSrc =
                rarityNum !== undefined
                  ? SKIN_IMAGES_BY_RARITY[rarityNum] ??
                    "/images/rarity_common.png"
                  : "/images/rarity_common.png";

              return (
                <div
                  key={id}
                  className="border rounded-lg p-4 text-xs bg-slate-800"
                >
                  <div className="mb-5 rounded bg-slate-700 flex items-center justify-center overflow-hidden">
                    <img
                      src={imgSrc}
                      alt={rarityLabel}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="break-all mb-1">
                    <span className="font-semibold">ID:</span> {id}
                  </div>
                  <div>
                    <span className="font-semibold">Rarity:</span> {rarityLabel}
                  </div>
                  <button
                    className="mt-5 bg-red-800 items-right hover:bg-red-400 px-0.5 py-0.25 rounded text-xs"
                    onClick={() => deleteSkin(id)}
                  >
                    Delete
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
