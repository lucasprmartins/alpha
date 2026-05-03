DO $$
BEGIN
	EXECUTE 'ALTER DATABASE ' || quote_ident(current_database()) || ' SET timezone TO ''America/Sao_Paulo''';
END
$$;--> statement-breakpoint
SET TIME ZONE 'America/Sao_Paulo';
