## ConsenSys Grader Guide

For ease of testing, please follow this guide to grade the Dapp. 

### Ubuntu Virtual Box: 
Please ensure that your virtual box ubuntu system is set up properly. If you run into any errors please check that you are using the following:

* curl installed 7.50.3
* nodejs version 8.11.4 installed
* truffle v4.1.14
* solidity v0.4.24
* using ganache-cli
* downloaded web3js

### Clone Repo: 
Simply clone the git repo to your local machine so you can access the folder from your cli..

` git clone https://github.com/ericbrown99/MaatsNetwork `


### Testing: 
Simply use truffle test and ganache-cli 

### Running the App in the web server: 

For the web server please use nom's lite server by running: 

`npm run start`

### Ganache-Cli for running App
Please run ganache-cli with the following flag to control the block time. 

`ganache-cli -b 2 `

This sets the block time to 2 seconds. This should keep grading quick and easy but also ensures that the "now" global variable registers correctly in ganache as otherwise it won't update the now variable, rendering my auction pricing logic useless. 

### Migrate
Migrate the contracts to the ganache-cli provided blockchain.

**Note:** Sometimes MetaMask can get confused when listening to local blockchains. If you run into issues with metamask communicating with the chain, stop the current blockchain, make sure MetaMask is listening to a different network (ie. main chain), restart the local blockchain. Copy and paste the seed phrase into MetaMask and then switch MetaMask back to listening for the local 8545 chain. 

### Dapp Walkthrough 

Now that everything is set up, follow these steps to ensure there are no hiccups in the walkthrough process. 

**Important Note:** Please add a 0 to the gas cost for every metaMask transaction to avoid failures do to not enough gas. For whatever reason, metaMask has a tendency to under predict the gas cost. So if it predicts the gas cost as 875, please change it to 8750!

For UI I have already added in images for the first store. (Additional stores after this won't have as clean of a UI) They feature Bossy Chicago, directory of stores featuring women owned businesses in the Chicagland area. Bossy Chicago was started by two amazing women at Northwestern and has now grown significantly. They have done amazing work to empower these owners in the chicagoland area. Please check out what they are doing at bossychicago.com. I received permission to use their logo and product images for this project. 

1. Create MetaMask accounts first for ease of use (We will interact with these accounts in a moment): 
	* Account 1: starts as the Maats network Owner. Change the
 name to: Network Owner in MetaMask 
	* Account 2: Use this as the Maats Admin account. Change the name to: Maats Admin
	* Account 3: The first store owner account. Change the name to: Bossy Chicago. This will be the account which owns the store 
	* Account 4: The Bossy Store Admin. Change the name to Bossy Admin. 
	* Account 5: This account will act as the buyer. Change the name to: Buyer
	* Accounts 6-10 can be used to play around with the application if you want once you are done with the walkthrough. 

2. Make sure you are on the Network Owner account in metamask to enable the Network Owner functions. 

3. Set up the network by clicking the Unpause button and then the Set Escrow contract button.

4. Under the Manage admins section copy and paste the address of the Maats Admin account into the section which says New Admin Address and then click Create Maats Admin. If you reload the page, you will see that account address as the first admin in the list of admins below. 

5. You can test the remove admin functionality by following the same logic, just ensure that you add the admin back in after you have tested that 

6. We will test the Change Maats Owner functionality and the withdraw funds functionality later!!

7. Switch to the Maats Admin account. You will see that now only the Maats Admin functions are available and the owner functions are no longer available. 

8. Create a store owner. Copy and paste the Bossy Chicago account address into the "New Store Owner Address" Section and then type "Bossy Chicago" into the Requested Store Name section. The store name is used as a unique identifier for removing the store later so make sure you type it in like above. After clicking Create Owner, reload the page. You should see the store show up now in the section under the about paragraph. 

9. We will test the remove store functionality later. 

10. Navigate to the store and you should see that there are no products yet in the store.  Switch to the Bossy Chicago account and the store owner functions should become available. 

11. Just like we did with the network owner, add the Bossy Admin by copy and pasting the Bossy Admin address into the new admin address section. By switching to the Bossy Admin account in metaMask and reloading the page, it will show access to only the admin functions. (Note that for both the network and the store, the owners have access to both owner functions and admin functions) 

12. You can test removing the store admin just like with the overall network. 

13. Add a set price product. Use a low initial inventory (1 or 2) to show what happens when the product is out of stock. Reload the page and navigate back to the Bossy Chicago store to see the new product. If you click on the product and are still on the owner account, you will see an additional line under the product description where owners can ship products which have been bought. 

14. Change the price of the set price product: Change the price of the product you just created: ProductId 0, to 2. Reload the page and navigate to the product to see the change reflected. 

15. Go to the Buyer account and buy the set price product a couple times and see the reflected change in inventory. If you are on the Bossy Owner account, you will also be able to ship the products which were bought. Notice that the funds in the owner account don't go up when a product is bought. This is because the funds are held in the escrow account until the owner ships the product to the buyer. If you click Ship Product X, take not of the funds in the owner account and see the change reflected. 

16. Add inventory to the set price product. The product Id is 0. Add inventory of 5 and see the reflected change in the inventory of the product. 

17. Navigate back to the Bossy Chicago account and create an auction product. Start with a price of 1, a reserve price of 0 and a length of 0.5 hours. Reload the page and navigate to the product. Note that the price is less than 1. This is because the price of the product descends over the course of the auction. If you reload the page again, you will see that the price is again lower than it was previously. 

18. Go to the Buyer account and navigate to the auction product.  Note that the price listed may not reflect the price when actually buying the product due to time dependence. That said, the price could only be lower. 

20. Now that we are done with the main tests of the Dapp, you can go back and test the functionalities we skipped such as changing the Maats owner network, removing a store and sending/withdrawing funds from the network contract. 

21. Let me know if there are any concerns or troubles in your testing! I hope you enjoyed it!

