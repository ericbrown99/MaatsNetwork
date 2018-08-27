# MaatsNetwork
100% distributed marketplace for women/minority owners.
Created for my final project for the 2018 ConsenSys Academy

## What Does Maat's Do?
Maats is a distributed marketplace of online stores (think amazon) for women and minority owned businesses. It 
allows these owners to sell products and manage funds with ease. Trustlessness of payments is acheived through a codified 
escrow service and payments are easy with the built in payment functions of the blockchain. The distributed nature of the 
network of stores reduces the costs associated with traditional online market places meaning that owners on the network 
experience a larger percentage of their revenue. 

## How To Set It Up
An extensive set up and use guide can be found in the GradingGuide.md file in this repo. 

### ConsenSys Peer Graders
Please use the GradingGuide.md file

### Here is the high level setup: 
Clone this github repo to your local machine using: 

`git clone https://github.com/ericbrown99/MaatsNetwork `

Use npm's lite server to run the web portal (make sure you are using Firefox or Chrome with the MetaMask extension

`npm run start`

Set up the local blockchain on port 8545 using ganache-cli:

**For Unit Testing**: 

`ganache-cli`

**For Interacting with WebApp**: 

`ganache-cli -b 2`
This sets the block time to 2 seconds. We do this to ensure that ganache properly reports the 'now' variable which is used
to calculate the price of auction products. 
