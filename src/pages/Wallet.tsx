import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Wallet as WalletIcon, Globe, Loader2, ChevronDown, Shield, LogOut, User, Clock } from "lucide-react";
import { blockchainSystem } from "@/lib/blockchain";
import { useTheme } from "@/components/ThemeProvider";
import { WalletConnection } from "@/lib/types";
import { walletService } from "@/lib/walletService";
import { useNavigate } from "react-router-dom";

const Wallet = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [walletConnection, setWalletConnection] = useState<WalletConnection | undefined>(undefined);
  const [isVerified, setIsVerified] = useState(false);
  const [networkInfo, setNetworkInfo] = useState<{ gasPrice: string; latestBlock: number } | null>(null);
  const [didIdentifier, setDidIdentifier] = useState<string | null>(null);
  
  // Check if wallet is already connected
  useEffect(() => {
    const checkWalletConnection = async () => {
      // Check for existing connection
      const connection = walletService.getWalletConnection();
      if (connection) {
        setWalletConnection(connection);
        
        // Verify connection is still valid with MetaMask
        const isConnected = await walletService.isWalletConnected();
        if (!isConnected) {
          setWalletConnection(undefined);
          localStorage.removeItem('walletConnection');
        } else {
          // Get latest network information
          const networkData = await walletService.getNetworkInfo();
          if (networkData) {
            setNetworkInfo(networkData);
          }
        }
      }
      
      // Check if user is verified
      const verification = blockchainSystem.getVerification();
      setIsVerified(!!verification && verification.verified);
      
      // Get DID identifier
      const did = walletService.getDidIdentifier();
      setDidIdentifier(did);
    };
    
    checkWalletConnection();
    
    // Set up interval to refresh network info
    const intervalId = setInterval(async () => {
      if (walletConnection) {
        const networkData = await walletService.getNetworkInfo();
        if (networkData) {
          setNetworkInfo(networkData);
        }
      }
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(intervalId);
  }, []);
  
  const handleConnectWallet = async () => {
    setIsConnecting(true);
    
    try {
      const response = await walletService.connectWallet();
      
      if (response.success && response.data) {
        setWalletConnection(response.data);
        toast.success("Wallet connected successfully!");
        
        // Get network info
        const networkData = await walletService.getNetworkInfo();
        if (networkData) {
          setNetworkInfo(networkData);
        }
        
        // Register with blockchain system if needed
        const currentUser = blockchainSystem.getCurrentUser();
        if (!currentUser) {
          await blockchainSystem.registerIdentity("auto-id", "auto-selfie");
        }
      } else {
        toast.error(response.message || "Failed to connect wallet");
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast.error("An error occurred while connecting the wallet");
    } finally {
      setIsConnecting(false);
    }
  };
  
  const handleDisconnectWallet = async () => {
    setIsDisconnecting(true);
    
    try {
      const response = await walletService.disconnectWallet();
      
      if (response.success) {
        setWalletConnection(undefined);
        setNetworkInfo(null);
        toast.success("Wallet disconnected successfully!");
      } else {
        toast.error(response.message || "Failed to disconnect wallet");
      }
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      toast.error("An error occurred while disconnecting the wallet");
    } finally {
      setIsDisconnecting(false);
    }
  };
  
  const navigateToIdentityKeys = () => {
    navigate('/identity');
  };

  const navigateToPasswordRecovery = () => {
    navigate('/wallet/recover');
  };
  
  const formatAddress = (address: string): string => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };
  
  const cardBg = theme === "dark" ? "bg-gray-900 border-gray-800" : "";
  const textColor = theme === "dark" ? "text-white" : "";
  const textMutedColor = theme === "dark" ? "text-gray-400" : "text-gray-600";
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-3xl font-bold ${theme === "dark" ? "text-[#ED64A6]" : "text-blue-700"}`}>
            Web3 Wallet
          </h1>
          <p className={textMutedColor}>
            Connect your wallet to the blockchain
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={navigateToIdentityKeys}
            className="flex items-center gap-2"
          >
            <User className="w-4 h-4" />
            Identity Keys
          </Button>
          <Button
            variant="outline"
            onClick={navigateToPasswordRecovery}
            className="flex items-center gap-2"
          >
            <Shield className="w-4 h-4" />
            Recover Password
          </Button>
        </div>
      </div>
      
      {/* Wallet Connection */}
      <Card className={cardBg}>
        <CardHeader>
          <CardTitle className={textColor}>
            <div className="flex items-center">
              <WalletIcon className="w-6 h-6 mr-2" />
              Wallet Connection
            </div>
          </CardTitle>
          <CardDescription className={textMutedColor}>
            Connect your Web3 wallet to the blockchain
          </CardDescription>
        </CardHeader>
        <CardContent>
          {walletConnection ? (
            <div>
              <div className={`p-4 rounded-md ${theme === "dark" ? "bg-green-900/30" : "bg-green-50"}`}>
                <div className="flex items-start">
                  <Shield className={theme === "dark" ? "text-green-400 w-5 h-5 mr-3" : "text-green-600 w-5 h-5 mr-3"} />
                  <div>
                    <p className={`font-medium ${theme === "dark" ? "text-green-400" : "text-green-800"}`}>
                      Wallet Connected
                    </p>
                    <p className={theme === "dark" ? "text-gray-300 mt-1" : "text-gray-700 mt-1"}>
                      Your wallet is successfully connected to the blockchain.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className={`mt-4 p-4 rounded-md border ${theme === "dark" ? "border-gray-700 bg-gray-800" : "border-gray-200"}`}>
                <div className="flex justify-between items-center">
                  <div>
                    <div className={`text-sm ${textMutedColor}`}>Connected Wallet</div>
                    <div className={`font-medium ${textColor}`}>{formatAddress(walletConnection.address)}</div>
                  </div>
                  <Button variant="outline" size="sm" className="flex items-center">
                    <span>{walletConnection.network}</span>
                    <ChevronDown className="ml-1 w-4 h-4" />
                  </Button>
                </div>
                
                <div className="mt-4 flex justify-between items-center">
                  <div>
                    <div className={`text-sm ${textMutedColor}`}>Balance</div>
                    <div className={`font-medium ${textColor}`}>
                      {walletConnection.balance ? `${parseFloat(walletConnection.balance).toFixed(4)} ETH` : 'Loading...'}
                    </div>
                  </div>
                  <div className={`text-sm flex items-center ${theme === "dark" ? "text-green-400" : "text-green-600"}`}>
                    <Clock className="w-4 h-4 mr-1" />
                    <span>Updated just now</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className="text-sm flex justify-between">
                    <span className={textMutedColor}>Connected at</span>
                    <span className={textColor}>{formatDate(walletConnection.connectedAt)}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 grid grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className="w-full flex items-center justify-center"
                  onClick={handleDisconnectWallet}
                  disabled={isDisconnecting}
                >
                  {isDisconnecting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {isDisconnecting ? "Disconnecting..." : (
                    <>
                      <LogOut className="w-4 h-4 mr-2" />
                      Disconnect
                    </>
                  )}
                </Button>
                <Button 
                  className={`w-full ${theme === "dark" ? "bg-purple-700 hover:bg-purple-800" : ""}`}
                  onClick={navigateToIdentityKeys}
                >
                  <User className="w-4 h-4 mr-2" />
                  Identity Keys
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <WalletIcon className={`w-16 h-16 mx-auto mb-4 ${theme === "dark" ? "text-purple-400" : "text-blue-500"}`} />
              <h3 className={`text-lg font-medium mb-2 ${textColor}`}>Connect Your Wallet</h3>
              <p className={`text-sm mb-6 max-w-md mx-auto ${textMutedColor}`}>
                Connect your Web3 wallet to interact with the blockchain and manage your identity NFTs and transactions.
              </p>
              
              <Button 
                onClick={handleConnectWallet} 
                disabled={isConnecting}
                className={`w-full max-w-xs ${theme === "dark" ? "bg-purple-700 hover:bg-purple-800" : ""}`}
              >
                {isConnecting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Blockchain Status */}
      <Card className={cardBg}>
        <CardHeader>
          <CardTitle className={textColor}>
            <div className="flex items-center">
              <Globe className="w-6 h-6 mr-2" />
              Blockchain Status
            </div>
          </CardTitle>
          <CardDescription className={textMutedColor}>
            Current blockchain network status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-md ${theme === "dark" ? "bg-gray-800" : "bg-gray-50"}`}>
                <div className={`text-sm ${textMutedColor}`}>Network</div>
                <div className={`font-medium ${textColor}`}>
                  {walletConnection ? walletConnection.network : "Not Connected"}
                </div>
              </div>
              
              <div className={`p-4 rounded-md ${theme === "dark" ? "bg-gray-800" : "bg-gray-50"}`}>
                <div className={`text-sm ${textMutedColor}`}>Status</div>
                <div className={`font-medium flex items-center ${walletConnection ? "text-green-500" : theme === "dark" ? "text-red-400" : "text-red-500"}`}>
                  <span className={`w-2 h-2 rounded-full mr-2 ${walletConnection ? "bg-green-500" : "bg-red-500"}`}></span>
                  {walletConnection ? "Active" : "Disconnected"}
                </div>
              </div>
            </div>
            
            <div className={`p-4 rounded-md ${theme === "dark" ? "bg-gray-800" : "bg-gray-50"}`}>
              <h3 className={`text-sm font-medium mb-3 ${textColor}`}>Network Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className={textMutedColor}>Gas Price</span>
                  <span className={textColor}>{networkInfo ? networkInfo.gasPrice : (walletConnection ? "Loading..." : "N/A")}</span>
                </div>
                <div className="flex justify-between">
                  <span className={textMutedColor}>Latest Block</span>
                  <span className={textColor}>{networkInfo ? networkInfo.latestBlock.toLocaleString() : (walletConnection ? "Loading..." : "N/A")}</span>
                </div>
                <div className="flex justify-between">
                  <span className={textMutedColor}>Confirmation Time</span>
                  <span className={textColor}>{walletConnection ? "~15 seconds" : "N/A"}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Identity Status */}
      <Card className={`${cardBg} ${theme === "dark" ? "border-purple-900/50" : "border-blue-100"}`}>
        <CardHeader className={theme === "dark" ? "bg-purple-900/20" : "bg-blue-50"}>
          <CardTitle className={textColor}>Identity Status</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className={textColor}>Identity Verification</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${isVerified 
                ? "bg-green-100 text-green-800" 
                : "bg-yellow-100 text-yellow-800"}`}>
                {isVerified ? "Complete" : "Incomplete"}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className={textColor}>Web3 Wallet</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${walletConnection 
                ? "bg-green-100 text-green-800" 
                : "bg-yellow-100 text-yellow-800"}`}>
                {walletConnection ? "Connected" : "Not Connected"}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className={textColor}>Identity Keys</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${walletService.hasGeneratedKeys() 
                ? "bg-green-100 text-green-800" 
                : "bg-yellow-100 text-yellow-800"}`}>
                {walletService.hasGeneratedKeys() ? "Generated" : "Not Generated"}
              </span>
            </div>
            
            {didIdentifier && (
              <div className={`p-3 rounded-md ${theme === "dark" ? "bg-gray-800" : "bg-gray-50"}`}>
                <div className={`text-sm ${textMutedColor}`}>DID Identifier</div>
                <div className={`font-medium ${textColor} mt-1 break-all`}>
                  {didIdentifier}
                </div>
              </div>
            )}
            
            <div className="mt-4">
              {(!isVerified || !walletService.hasGeneratedKeys()) && (
                <Button 
                  asChild 
                  variant="outline" 
                  className="mt-2 w-full"
                >
                  <a href="/identity">Complete Identity Verification</a>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Wallet;
