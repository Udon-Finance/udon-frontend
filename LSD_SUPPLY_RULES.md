### **LSD Implementation Flows for Udon Platform**

**Project Context:**
This document outlines the detailed operational flows for integrating Liquid Staking Derivatives (LSD) functionality into the Udon lending and borrowing platform, built on Chromia. The native asset for LSD will be CHR. The core lending and borrowing functionalities are already established. These flows describe how users will supply CHR to acquire LSD tokens, and how they will withdraw their CHR, either slowly via unstaking or quickly via DEX swaps.

**Key Concepts & Token Types:**

- **CHR:** The native asset of the Chromia blockchain.
- **stCHR (Staked CHR):** A liquid staking derivative token minted on Udon Chain, representing CHR that has been supplied for staking. This token can be used in other DeFi protocols.
- **astCHR (Accrued Staking CHR / Account Staking CHR):** A token minted on Udon Chain representing the user's total entitlement from their initial CHR supply, including accrued rewards from both staking and lending. This acts as the user's primary liquid representation of their supplied value on Udon.
- **APY:** Annual Percentage Yield, representing the returns from lending and/or staking.

**Participating Components:**

- **FE (Frontend):** The user interface layer where users initiate and monitor operations.
- **UDON CHAIN:** The primary blockchain for Udon platform logic, managing user accounts, token minting/burning (`stCHR`, `astCHR`), internal pools, and initiating cross-chain transfers.
- **SCRIPT:** Automated scripts or smart contracts responsible for executing complex logic, performing checks, and coordinating operations across different chains.
- **ECO CHAIN:** An auxiliary blockchain, potentially serving as an intermediary bridge or for specific administrative functions during cross-chain transfers.
- **BSC (Binance Smart Chain):** An external blockchain where the actual CHR staking operations (e.g., with validators) may occur. It also holds mapped user accounts for cross-chain interactions.
- **DEX CHAIN:** A Decentralized Exchange blockchain (could be BSC-based or another chain with a DEX) used for token swaps to facilitate quick withdrawals.

---

### **🧭 Flow: User Supply with CHR (LSD Deposit)**

**Objective:** To enable users to deposit their native CHR into the Udon system to acquire `astCHR` (and implicitly `stCHR`), thereby initiating the process of earning both lending APY and staking APY on their supplied assets.

**Detailed Flow of Operations:**

1.  **FE (Frontend):**

    - **1. Call `supply20CHR` operation:** The user, through the Frontend interface, initiates a transaction to deposit 20 CHR into the Udon platform. This is the starting point of the supply process.

2.  **UDON CHAIN:**

    - **2. Transfer 20 CHR to `pool admin` for cross-chain at step 8:** Upon receiving the `supply20CHR` call, the Udon Chain smart contract transfers the user's 20 CHR from their wallet to an internal `admin pool`. This pool acts as a temporary holding area for liquidity before the CHR is sent off-chain for actual staking.
    - **3. Mint 20 `stCHR` pool:** Concurrently or immediately after, the Udon Chain smart contract mints 20 `stCHR` tokens. These `stCHR` tokens represent the user's staked CHR and are added to an internal `stCHR` pool, making them available for the liquid staking mechanism.
    - **4. Supply flow with 20 `stCHR`:** The 20 newly minted `stCHR` tokens are integrated into the platform's supply flow mechanism. This typically means they are now accounted for within the system's yield-generating logic, ready to accrue staking rewards.
    - **5. Mint 19.89 `astCHR` for user:** The Udon Chain smart contract then mints 19.89 `astCHR` tokens and transfers them directly to the user's wallet on Udon Chain.
      - **Purpose:** `astCHR` serves as the user's liquid receipt token, representing their claim to the supplied CHR plus future accrued yield.
      - **Note on Quantity (19.89 vs 20):** The slight discrepancy (0.11 CHR) between the initially supplied 20 CHR and the minted 19.89 `astCHR` likely accounts for a protocol fee, a small allocation to a lending pool, or a specific conversion rate that favors the protocol's sustainability. This suggests that a portion might be immediately utilized for the lending mechanism.

3.  **UDON CHAIN & SCRIPT:**

    - **6. Create Staking Position with supplied 20 CHR:** A unique "Staking Position" record is created and associated with the user on the Udon Chain. This record tracks the user's 20 CHR designated for staking, linking it to the overall staking infrastructure.
    - **8. Checking Staking POS with supplied 20 CHR:** A `SCRIPT` (likely an off-chain automated service or a specialized smart contract function) performs a series of checks on the Proof of Stake (POS) mechanism, verifying the eligibility and readiness of the 20 CHR for external staking. This step ensures all prerequisites for initiating staking on BSC are met.

4.  **SCRIPT & BSC (and ECO CHAIN as a bridge/auxiliary step):**

    - **9. Cross-chain transfer from `pool admin Udon` to `staking pool`:** The `SCRIPT` initiates a cross-chain transfer of the 20 CHR from the `admin pool` on Udon Chain (where they were temporarily held from Step 2) to a dedicated `staking pool` on the target staking chain.
    - **10. Bridge to BSC with 20 CHR:** The 20 CHR are then bridged to Binance Smart Chain (BSC). This could be part of the cross-chain transfer or a separate, subsequent bridging operation.
    - **10. Transfer to `account mapping user`:** Once on BSC, the 20 CHR are transferred to a mapped account belonging to the user on the BSC network. This account is typically managed by the protocol or a designated staking service provider.
    - **11. Staking:** The 20 CHR held in the user's mapped account on BSC are then officially delegated to BSC validators or integrated into a staking contract on BSC, beginning the actual staking process and earning staking APY.

5.  **UDON CHAIN:**

    - **12. Update state staking position:** After successful initiation of staking on BSC, the Udon Chain smart contract updates the status of the user's "Staking Position" (created in Step 6) to reflect that the CHR is now actively staked.

6.  **FE (Frontend) - Outcome Scenarios:**
    - **7. Supply successful with only APY from lending (return):** (This path is taken if staking on BSC fails or is delayed, or if the system design allows for partial activation.) If, for any reason, the staking process on BSC (Steps 8-11) is not fully completed or confirmed, the Frontend receives a "return" signal. The user is informed that their supply was successful, but for now, they are only earning APY from the lending portion of their supplied assets. The `astCHR` still reflects their claim, but the staking APY component is not yet active.
    - **13. Supply successful with both lending APY + Staking APY (reload):** Once all steps, including the successful staking on BSC (Steps 8-12), are confirmed, the Frontend triggers a "reload". The user's interface is updated, displaying that their CHR supply was fully successful, and they are now actively earning APY from both the lending and staking components.

---

### **🧭 Flow: Slow Withdraw CHR (LSD Unstaking)**

**Objective:** To enable users to redeem their `astCHR` holdings for native CHR, including all accrued principal and rewards, through a controlled, time-gated unstaking process (typically referred to as a "defrosting" or "unbonding" period). This method prioritizes security and full reward accrual over immediate liquidity.

**Detailed Flow of Operations:**

1.  **FE (Frontend):**

    - **1. Call `slow withdraw 20 astCHR` operation:** The user, through the Frontend, initiates a request to slowly withdraw 20 `astCHR`. This implies they are redeeming their `astCHR` for the underlying CHR.

2.  **UDON CHAIN:**

    - **2. Calculate scaled amount to 21.3 `stCHR`:** The Udon Chain smart contract calculates the total amount of `stCHR` the user is entitled to based on their `astCHR` holdings and accrued rewards.
      - **Breakdown:** This 21.3 `stCHR` is comprised of:
        - Original principal equivalent (e.g., from the initial 20 CHR supplied).
        - Lending APY: 0.3 `stCHR` accrued from the lending portion.
        - Staking APY: 1 `stCHR` accrued from the staking portion.
      - **Total:** 20 (Principal) + 0.3 (Lending APY) + 1 (Staking APY) = 21.3 `stCHR`.
    - **3. Burn 20 `astCHR` and Transfer 21.3 `stCHR` to user:** The 20 `astCHR` tokens held by the user are burned on Udon Chain, effectively removing their liquid staking derivative representation. Simultaneously, 21.3 `stCHR` tokens (representing the total accrued value in a liquid staking token form) are transferred to the user's wallet on Udon Chain. This means the user now holds `stCHR` instead of `astCHR` for the withdrawal process.

3.  **UDON CHAIN & SCRIPT:**

    - **4. Create withdraw request 21 `stCHR` (stCHR not applying APY for staking):** A formal withdrawal request is created on Udon Chain for **21 `stCHR`**.
      - **Note on Quantity (21 vs 21.3):** This indicates that the 0.3 `stCHR` from lending APY might be immediately available or treated separately, while the core principal and staking yield (21 `stCHR`) go through the specific unstaking flow.
      - **No APY application:** During this withdrawal period, the 21 `stCHR` will **not** continue to accrue staking APY, as it's being "unbonded."
    - **7. Update staking POS with denouncing staking and burn 21 `stCHR`:** The user's "Staking Position" on Udon Chain is updated to reflect that they are "denouncing" (initiating unstaking for) 21 `stCHR`. These 21 `stCHR` are effectively "burned" from their active staking status, initiating the unstaking countdown.

4.  **SCRIPT & ECO CHAIN & BSC:**

    - **5. Checking withdraw POS with supply 20 CHR:** A `SCRIPT` performs a check on the Proof of Stake (POS) system, likely verifying the status of the original 20 CHR that was supplied for staking. This ensures the underlying assets are correctly linked to the unstaking request.
    - **6. Mapped wallet call withdraw request:** The user's mapped wallet on BSC (where the actual CHR might be staked) receives or calls a withdrawal request, signaling the intent to unstake.
    - **8. Send withdraw request and pls wait 14 days to withdraw:** The system sends a confirmation of the withdrawal request to the user and explicitly informs them about the mandatory 14-day waiting period. This is the "defrosting" or "unbonding" period required by many Proof of Stake mechanisms.
    - **9. Trigger withdraw script when until 14 days:** After exactly 14 days have passed since the request in Step 8, an automated `SCRIPT` is triggered. This script initiates the final steps of the unstaking process.
    - **10. Mapped wallet call withdraw:** The `SCRIPT` commands the user's mapped wallet on BSC to execute the actual withdrawal of the now unbonded CHR.

5.  **BSC & ECO CHAIN:**

    - **11. Transfer to admin:** The unbonded CHR (likely 20 CHR + staking yield portion from BSC) is transferred from the BSC staking mechanism to an administrative account on BSC.
    - **12. Bridge to `eco admin`:** The CHR from the BSC admin account is then bridged to an `admin account` on the ECO Chain. ECO Chain acts as an intermediate bridge in this multi-chain transfer.

6.  **UDON CHAIN:**

    - **13. Cross-transfer to `admin pool`:** The CHR is finally cross-transferred from the `admin account` on ECO Chain to an `admin pool` on the Udon Chain. This brings the native CHR back to the Udon Chain for final user distribution.
    - **14. Update state staking POS:** The Udon Chain smart contract updates the overall "Staking Position" to reflect that the withdrawal has been processed and the corresponding CHR is no longer considered staked.

7.  **FE & UDON CHAIN:**
    - **15. User Already to withdraw (reload):** The Frontend interface is updated (reloaded) to inform the user that their CHR is "Already to withdraw," meaning it's available for final claim.
    - **16. User call withdraw CHR:** The user explicitly calls the "withdraw CHR" function on the Frontend to claim their funds.
    - **17. Transfer from `admin` to user:** The CHR is transferred from the `admin pool` on Udon Chain (from Step 13) to the user's wallet on Udon Chain.
    - **18. Update state staking POS:** A final update is performed on the staking POS state to finalize the withdrawal record.

---

### **🧭 Flow: Quick Withdraw CHR (LSD Swap/Liquidation)**

**Objective:** To enable users to quickly convert their `astCHR` (or `stCHR`) holdings into native CHR by utilizing a Decentralized Exchange (DEX). This method bypasses the lengthy unstaking period but is subject to DEX liquidity, trading fees, and potential slippage.

**Detailed Flow of Operations:**

1.  **FE (Frontend):**

    - **1. Call `quick withdraw 20 astCHR` operation:** The user, through the Frontend, initiates a request for a quick withdrawal of 20 `astCHR`. This signals their preference for immediate liquidity.

2.  **UDON CHAIN:**

    - **2. Calculate scaled amount:** The Udon Chain smart contract calculates the total amount of `stCHR` the user is entitled to redeem, including all accrued profits.
      - **Breakdown:** Similar to the slow withdraw, this totals 21.3 `stCHR`:
        - Principal equivalent (from 20 `astCHR`).
        - Lending APY: 0.3 `stCHR`.
        - Staking APY: 1 `stCHR`.
      - **Total:** 20 (Principal) + 0.3 (Lending APY) + 1 (Staking APY) = 21.3 `stCHR`.
    - **3. Burn 20 `astCHR`:** The 20 `astCHR` tokens representing the user's principal are burned on Udon Chain.
    - **4. Transfer 21.3 `stCHR` to user:** 21.3 `stCHR` (representing the total value including accrued profits) is transferred to the user's wallet on Udon Chain. At this point, the user holds `stCHR`, which is the liquid staking derivative ready for swapping.

3.  **UDON CHAIN & SCRIPT:**

    - **5. Create withdraw request:** A formal withdrawal request is initiated within the system.
    - **7. Checking withdraw position with 21.3 `stCHR`:** The `SCRIPT` (or a smart contract function) performs checks on the withdrawal request, verifying the 21.3 `stCHR` amount and associated position.

4.  **FE (Frontend) - Edge Case:**

    - **6. Wait for request withdraw (return):** If the request creation or initial checks fail (e.g., insufficient `stCHR` balance, system error), the Frontend receives a "return" signal, and the user is prompted to wait or an error message is displayed.

5.  **SCRIPT & DEX CHAIN:**

    - **8. Cross-chain transfer `stCHR` from `admin pool Udon` to Dex:** The `SCRIPT` orchestrates a cross-chain transfer of the 21.3 `stCHR` from an `admin pool` on Udon Chain (where the user's `stCHR` might be temporarily moved for this operation) to the DEX Chain.
    - **9. Call swap `stCHR` to CHR:** On the DEX Chain, a swap function is called to exchange the 21.3 `stCHR` for native `CHR`. This swap will typically occur against a liquidity pool for `stCHR`/`CHR`, and the actual amount of `CHR` received will depend on market price, slippage, and DEX fees.

6.  **UDON CHAIN:**

    - **10. Received CHR:** The Udon Chain's bridge or designated receiving address acknowledges and receives the `CHR` tokens that resulted from the swap on the DEX Chain.

7.  **SCRIPT & UDON CHAIN:**

    - **11. Cross-chain transfer CHR from Dex to Udon:** (Steps 10 and 11 often represent a single, seamless process of the swapped CHR returning to Udon Chain.) The `SCRIPT` facilitates the final cross-chain transfer of the `CHR` from the DEX Chain back to Udon Chain.

8.  **FE (Frontend):**

    - **"Already to withdraw" (reload):** The Frontend automatically reloads and updates the user's status to "Already to withdraw," indicating that the native CHR is now available for final claim.

9.  **FE (Frontend) & UDON CHAIN:**

    - **12. User withdraw:** The user explicitly clicks or confirms the "withdraw" action on the Frontend to claim their CHR.
    - **13. Transfer CHR from `admin` to user:** The native `CHR` (which has returned to an `admin pool` on Udon Chain after the DEX swap) is transferred directly to the user's wallet on Udon Chain.

10. **UDON CHAIN:**

    - **14. Update:** The Udon Chain smart contracts perform final internal updates to reflect the completion of the withdrawal and adjust any associated records (e.g., user balances, staking positions).

11. **FE (Frontend):**
    - **15. Withdraw successful:** The Frontend displays a "Withdraw successful" confirmation message to the user, finalizing the quick withdrawal process.
