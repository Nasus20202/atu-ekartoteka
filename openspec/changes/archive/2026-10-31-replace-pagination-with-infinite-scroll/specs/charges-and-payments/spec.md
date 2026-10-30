# Spec Delta

## REMOVED Requirements

### Requirement: Pagination on Admin User List

**Reason**: Manual page controls on the admin user list are replaced by infinite scrolling.
**Migration**: The behaviour now lives in `user-management` ("Admin User List Infinite Scroll") and `visual-design` ("Infinite Scroll — Automatic Loading on Scroll"). The `/api/admin/users` `page`/`limit` contract is unchanged.
