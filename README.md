# IS4228 Final Group Project : LeaseX - The Future of Decentralized Renting
LeaseX is a next-generation decentralized rental platform powered by blockchain technology. Designed to bring clarity, security, and efficiency to the rental process, LeaseX transforms how landlords and tenants connect. From property listings and rental applications to smart contract agreements, automated payments, and conflict resolution, LeaseX streamlines every step of the rental journey. A key feature of LeaseX is its community-based dispute resolution system. Verified Real Estate Experts (Validators) can objectively assess issues and cast votes to ensure fair and transparent outcomes, eliminating bias and enhancing trust across the ecosystem.

## Instuctions to setup backend

1. Ensure that nodejs is installed

2. Install truffle

   ```bash
   npm install truffle -g
   ```

3. Install Ganache from [Truffle Suite](https://trufflesuite.com/ganache/)

4. Install all node dependencies

   ```bash
   cd IS4228-LeaseX
   npm install
   ```

5. Start up Ganache locally (Ensure that the server is running on port 7545 AND compiler version is `0.8.19`)

6. Compile the Truffle project smart contracts into bytecode for the EVM

   ```bash
   truffle compile
   ```
## Instructions to run client

### Generating build and deploying onto Ganache

1. Start up `Ganache` as described in the documentation. **Ensure that you set the network ID to be `1337`.**
1. `npm install` from the root directory for dependencies to build and deploy the smart contracts.
1. Once done, `truffle compile` to check if the smart contracts are compilable.
1. Then, `truffle build` to generate the relevant build for the smart contracts.
1. Then, `truffle migrate` to deploy the relevant smart contracts onto Ganache.

### Running the client

1. `cd client` to enter the client directory.
2. Set up the `.env.local` as described in the documentation.
3. `npm install` to install the relevant modules required to run the frontend.
4. `npm run dev` to start up the client.

7. Deploy the Truffle project smart contracts on the Local Ganache blockchain

   ```bash
   truffle migrate
   ```
