## Documentation on Design and Security Decisions 

### Brief Overview 

My project is a distributed network of online stores. You can think of it as a distributed Amazon. The great thing about the distributed nature of Maat's is that it reduces the cost of infrastructure associated with centralized marketplaces like Amazon. The idea behind the project is that Women and Minority business owners could use the network to create their online marketplaces. This empowers these owners by removing concerns associated with trust (by using escrow contracts) and implementing payment systems since it is already built in with the blockchain. 


### Key Design Logic 

The Dapp is split into 6 contracts for modularity. There is a clear inheritance chain which can be followed up to the "StoreCore" contract which organizes all of the other contracts. Once deployed, only StoreCore need to be deployed because when compiled the other contracts it inherits are also compiled as a single large contract.  

My linked library/contract is a slight modification of OpenZeppelin's Escrow contract. You can see in the migration file that it is linked to the storeCore. I chose to use this as an external contract for security since the money management is of utmost concern. By separating the contracts there, it is isolated from attacks on the core Store contracts which manage the network.

The Dapp has Owner and Admin functions on the Network level (Maats) and on the store level (so that the women and minority owners can control the stores they create on the network). The owners and admins can all be controlled and modified. These owner and admin addresses for are also vital to controlling the stores they own as instead of using an array of stores which are accessed by the an ID, a mapping is used to put stores in storage. The mapping uses a storeId to access the store. What is unique, is that when an address call's a public function, a mapping is used to check if that address has an associated storeId which can then be used to access the store. What this essentially means is that it is impossible to access store functions unless your address is already identified as the owner or as an admin of a store. No storeId is entered into functions, reducing the accessibility to functions where access shouldn't be allowed. 

A "Store" is simply a struct stored in the contract as this is cheaper than deploying a new contract for each store. This struct also includes the Product struct for each product created. The Product struct includes an array of ItemStatus to keep track of the status (forSale, forAuction, Bought, Shipped) of instances of inventory. This quickly becomes large and expensive. Therefore, each struct is written to optimize how the data is packaged by the EVM to reduces the gas cost of creating stores/products and operating these stores. 