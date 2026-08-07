import { createPublicClient, formatEther, formatUnits, http, erc20Abi } from "viem";
import { baseSepolia } from "viem/chains";

/** Circle USDC on Base Sepolia */
export const BASE_SEPOLIA_USDC =
  "0x036CbD53842c5426634e7929541eC2318f3dCF7e" as const;

const MIN_USDC_TO_FUND = 0.05;

function getPublicClient() {
  const rpc =
    process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org";
  return createPublicClient({
    chain: baseSepolia,
    transport: http(rpc),
  });
}

export type AgentBalances = {
  address: string;
  eth: number;
  usdc: number;
  ethWei: string;
  usdcRaw: string;
  /** Enough USDC for a typical demo booking */
  funded: boolean;
  minUsdcToFund: number;
};

export async function getAgentBalances(
  address: `0x${string}`,
): Promise<AgentBalances> {
  const client = getPublicClient();
  const [ethWei, usdcRaw] = await Promise.all([
    client.getBalance({ address }),
    client.readContract({
      address: BASE_SEPOLIA_USDC,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [address],
    }),
  ]);

  const eth = Number(formatEther(ethWei));
  const usdc = Number(formatUnits(usdcRaw, 6));

  return {
    address,
    eth,
    usdc,
    ethWei: ethWei.toString(),
    usdcRaw: usdcRaw.toString(),
    funded: usdc >= MIN_USDC_TO_FUND,
    minUsdcToFund: MIN_USDC_TO_FUND,
  };
}
