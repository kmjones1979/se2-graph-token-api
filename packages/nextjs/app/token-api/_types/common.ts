import { NetworkId } from "../_hooks/useTokenApi";

/**
 * EVM Network information
 */
export interface EVMNetwork {
  id: NetworkId;
  name: string;
  icon?: string;
}
