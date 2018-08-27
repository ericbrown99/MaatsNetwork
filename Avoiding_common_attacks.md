
## Security Decisions and Preventing Common Attacks
As previously mentioned, many of the public functions utilize mappings not only to ensure that the address calling the function should have access, but they also use the mappings to pull up the instance of the store to be operated on. This acts as a double check to ensure that only addresses which should gain access can gain access. This also helps isolate attacks to specific stores on the network instead of the entire network.

### Function Exposure
Only the functions which need to be public are made public. Otherwise, logic is internalized so that it can't be abused by malicious actors. A current exception are functions which are normally marked as "internal" but have been made public for testing purposes.

### Emergency Stop
I have implemented an emergency stop by using a Pause/Unpause logic very similar to OpenZeppelin's "Pausable" contract. Every contract which shouldn't be accessible during an emergency stop has a "whenNotPaused" modifier attached to it. Conversely, if a function should only be accessible when the contract is paused it has a "whenPaused" modifier attached to it. In the constructor of the "storeCore" contract, the paused variable is set to true so that the network owner can ensure that everything is in place before un-pausing the network for the first time.

### Reentrancy Attack
The one place where there is a concern for a reentrancy attack is in the auction logic when someone has bought an auction product. To ensure that reentrancy isn't possible, we remove the auction from the network before sending the money to the escrow account. This way, any other calls to bid the auction will be rejected because the auction will no longer be "onAuction", failing a require statement.

### Uint Overflow Attack
There are very few places in which an overflow attack could take place. The network overall is protected from such an event since there aren't any public functions which are inputing values for uints.

This means that this could only happen internally to a store, which also would mean that the attacker would have to be a store admin gone rogue, or the store owner themselves (which I find to be very unlikely). To help protect against this, an owner can remove an admin that they find to be malicious. Only the owner can change the price of a product, and we ensure that the price is greater than or equal to 0 (non-negative). ProductId's are of particular concern because of their size only being uint8. That said, they are mostly used in mappings and require statements will throw if an overflow occurs do to mapping checks.

### Buffer Attacks (DOS)
There are a few array's in the contract. Mostly in concern to adding and removing admins, of which there are only allowed to be 5. Because this is already constrained we don't have to be worried about a buffer attack. An unconstrained array is ItemStatus which stores the status of each instance of inventory of a certain product. To ensure that this isn't abused, adding inventory is constrained to 500 items so that the loop isn't set to be dangerously high, exceeding the block gas limit.

### Assert Attack
There are no cases in which an external account controls an aspect of a require statement which could prevent others from interacting with the contract.

### Miner Vulnerabilities 
The only aspect which uses block time stamps is the auction products which decrease in price as time goes forward. This isn't a concern because a guarantee of the ethereum blockchain is that the time stamp wont go backwards. They could temporarily delay or accelerate the price decline of a product but it would be minimal and the decision to purchase would still be in the hands of the consumer.
