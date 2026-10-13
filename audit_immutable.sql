-- À appliquer après `prisma migrate deploy` : rend AuditLog en écriture seule (INSERT uniquement).
CREATE OR REPLACE FUNCTION audit_log_immutable() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'AuditLog est en écriture seule';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_log_no_change ON "AuditLog";
CREATE TRIGGER audit_log_no_change BEFORE UPDATE OR DELETE ON "AuditLog"
  FOR EACH ROW EXECUTE FUNCTION audit_log_immutable();
