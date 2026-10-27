package vn.edu.thuyetminh.auth;

/** Static roles for the MVP. A dynamic RBAC permission matrix is in the backlog. */
public enum AccountRole {
    ADMIN,
    SUPER_ADMIN,
    /** UC09: created by Admin only; sees its own reports (UC13). Never manages POI content or accounts. */
    SELLER
}
