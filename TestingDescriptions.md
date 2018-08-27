## Testing 

Below is an explanation of the tests used to ensure that the contracts work as expected. 

### Setup 

Several of the addresses are initialized for ease of use and readability. 

#### DeployContract() Hook
Sets up the contract environment by deploying both the core contract and the escrow contract, setting the escrow contract, and un-pausing the core contract.

#### DeployStore() Hook 
Sets up a store which can be interacted with for testing. Creates the store name and store owner. 

#### GetTransactionGasCost
Returns the amount of gas consumed by an function call. Used when testing that the money received from shipping an item is the correct amount by calculating the change in the owners funds minus the cost of calling the function. 

#### DeployProducts() Hook
Sets up 2 products which can be interacted with, both of them are SetPrice products 

### Tests 

#### Initial State: 
	1.Should Own Contract: Check that the msg.sender owns the contract after being deployed 
#### Admin Management: 
	2. Should Create Admin:Check that we can create an admin and get the that the address is an admin after being 
	created 
	3. Shouldn't recognize admin: Checks that getIsAdmin returns false when the input is an address which isn't an 
	admin.
	4. Should Recognize Removed Admin: Removes an admin and confirms that getIsAdmin() no longer returns true for that 
	address.
#### Pausing: 
	5. Should pause when not paused: ensure that the core contract can be correctly paused 
	6. Should un-pause when paused:  ensure that the core contract can correctly be unPaused. 
#### StoreOwnerManagement: 
	7. Should Create A Store Owner: Check that creating a store also sets the msg.sender as the store owner 
	8. Should Remove the Owner: Check that the network owner can remove the store owner and the store that they owner 
	9. Should Create Store: Check that the store is created and recognized when calling getStoreExists 
#### Store Management Tests: 
	10. Should Create Store Admin: Check that the owner of a store can appropriately create an admin for their store 
	11. Should remove admin: Check that the owner can remove an admin from their store 
	12. Should create product: Check that a product can be created in the store 
	13. Should Add Inventory: Check that inventory can be added to the selected product and 
	that the current inventory is now what is expected. 
	14. Should Change the Price of the product: Check that the owner can change the price of a product 
#### Store Purchasing Tests: 
	15. Should find first item for sale: Check that a newly created product and its newly created inventory is set to 
	the "forSale" itemStatus 
	16. Should let a customer buy an item: Check that anyone can buy a product which is for sale. 
	17. should ship and withdraw only the funds for the item shipped: This test is multifaceted. It tests that the owner 
	can ship the item which was purchased. It also checks that this action withdraws from the escrow account the amount 
	placed in the account when purchased. It ensures that the amount withdrawn is equal to the cost of the product and 
	not equal to the entire amount deposited in the escrow account for that owner. 
	18. Check that the item is marked as shipped: after the product has been shipped, it should be marked as such in its 
	itemStatus 
#### Tests For Store Auction: 
	19. Should Create Auction Product: Make sure that a newly created auction product is registered as on-auction 
	20. Should Correctly Compute Price: Since the price of an auction product is dependent on the current time, we need 
	to ensure that the logic for computing the price based off of the current time is correct. 
	21. Should Let Customer Bid on Auction: ensure that a customer can bid on an auction which is still "on-auction" 
	22. Owner should get funds when shipped: Similar test to as above but specifically for the auction product type. 
	23. Confirm product was shipped: again similar to above, but for the logic chain specific to the auction product 
	type. 
	
