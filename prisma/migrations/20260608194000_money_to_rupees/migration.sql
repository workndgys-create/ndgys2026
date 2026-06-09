UPDATE "Track" SET "fee" = ROUND("fee" / 100.0);
UPDATE "Competition" SET "feeSolo" = CASE WHEN "feeSolo" IS NULL THEN NULL ELSE ROUND("feeSolo" / 100.0) END,
                         "feeGroup" = CASE WHEN "feeGroup" IS NULL THEN NULL ELSE ROUND("feeGroup" / 100.0) END;
UPDATE "Registration" SET "amount" = ROUND("amount" / 100.0);
UPDATE "Invoice" SET "amount" = ROUND("amount" / 100.0),
                     "gstAmount" = ROUND("gstAmount" / 100.0);
UPDATE "CompetitionRegistration" SET "amount" = ROUND("amount" / 100.0);
UPDATE "PromoCode" SET "value" = ROUND("value" / 100.0) WHERE "kind" = 'FLAT';
UPDATE "Delegation" SET "amount" = ROUND("amount" / 100.0);