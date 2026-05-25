# AetherEx Security Specification

## Data Invariants
1. Orders must have a valid `userId` matching the request auth UID.
2. `createdAt` and `userId` fields in orders are immutable once created.
3. Wallet balances must be non-negative.
4. Users can only read and write their own data.
5. Market tickers are public (read-only for non-admins).

## The Dirty Dozen Payloads (Target: Permission Denied)
1. **Identity Spoofing**: Attempt to create an order for another user.
   `{ "userId": "victim_uid", "asset": "BTC", "side": "buy", ... }`
2. **State Shortcutting**: Attempt to create an order directly with "completed" status.
3. **Ghost Field Injection**: Attempt to add `isAdmin: true` to a user profile.
4. **Negative Balance**: Attempt to set wallet balance to a negative number.
5. **Orphaned Write**: Attempt to update an order with a non-existent userId.
6. **Immutable Violation**: Attempt to change the `createdAt` of an existing order.
7. **Cross-User Access**: User A attempts to read User B's transactions.
8. **Public Write**: Unauthenticated user attempts to update a market price.
9. **Role Escalation**: Regular user attempts to write to the `admins` collection.
10. **Shadow Update**: Attempt to update an order with an unallowed field `hiddenProfit`.
11. **ID Poisoning**: Attempt to write to a document with a 2KB junk document ID.
12. **System Field Overwrite**: Attempt to modify a system-calculated `pnl24h` field in the wallet.

## Test Strategy
- Use `@firebase/rules-unit-testing` logic (conceptually) to verify these constraints.
- Every write MUST be wrapped in an `isValid[Entity]` check.
