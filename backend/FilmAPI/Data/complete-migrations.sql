CREATE TABLE IF NOT EXISTS `__EFMigrationsHistory` (
    `MigrationId` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
    `ProductVersion` varchar(32) CHARACTER SET utf8mb4 NOT NULL,
    CONSTRAINT `PK___EFMigrationsHistory` PRIMARY KEY (`MigrationId`)
) CHARACTER SET=utf8mb4;

START TRANSACTION;
ALTER DATABASE CHARACTER SET utf8mb4;

CREATE TABLE `Cinemas` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `Nome` varchar(200) CHARACTER SET utf8mb4 NOT NULL,
    `Indirizzo` varchar(300) CHARACTER SET utf8mb4 NOT NULL,
    `Citta` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    CONSTRAINT `PK_Cinemas` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;

CREATE TABLE `Registi` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `Nome` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `Cognome` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `Nazionalita` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    CONSTRAINT `PK_Registi` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;

CREATE TABLE `Films` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `Titolo` varchar(200) CHARACTER SET utf8mb4 NOT NULL,
    `DataProduzione` datetime(6) NOT NULL,
    `RegistaId` int NOT NULL,
    `Durata` int NOT NULL,
    `CopertinaPath` varchar(500) CHARACTER SET utf8mb4 NULL,
    `FilmatoPath` varchar(500) CHARACTER SET utf8mb4 NULL,
    CONSTRAINT `PK_Films` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_Films_Registi_RegistaId` FOREIGN KEY (`RegistaId`) REFERENCES `Registi` (`Id`) ON DELETE RESTRICT
) CHARACTER SET=utf8mb4;

CREATE TABLE `Proiezioni` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `CinemaId` int NOT NULL,
    `FilmId` int NOT NULL,
    `Data` datetime(6) NOT NULL,
    `Ora` datetime(6) NOT NULL,
    CONSTRAINT `PK_Proiezioni` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_Proiezioni_Cinemas_CinemaId` FOREIGN KEY (`CinemaId`) REFERENCES `Cinemas` (`Id`) ON DELETE RESTRICT,
    CONSTRAINT `FK_Proiezioni_Films_FilmId` FOREIGN KEY (`FilmId`) REFERENCES `Films` (`Id`) ON DELETE RESTRICT
) CHARACTER SET=utf8mb4;

CREATE INDEX `IX_Films_RegistaId` ON `Films` (`RegistaId`);

CREATE UNIQUE INDEX `IX_Proiezioni_CinemaId_FilmId_Data_Ora` ON `Proiezioni` (`CinemaId`, `FilmId`, `Data`, `Ora`);

CREATE INDEX `IX_Proiezioni_FilmId` ON `Proiezioni` (`FilmId`);

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260312120556_InitialCreate', '9.0.11');

CREATE TABLE `Categorie` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `Nome` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    CONSTRAINT `PK_Categorie` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;

CREATE TABLE `Users` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `Email` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
    `PasswordHash` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Nome` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `Cognome` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `Telefono` varchar(20) CHARACTER SET utf8mb4 NULL,
    `Ruolo` int NOT NULL,
    `DataRegistrazione` datetime(6) NOT NULL,
    CONSTRAINT `PK_Users` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;

CREATE TABLE `FilmCategorie` (
    `FilmId` int NOT NULL,
    `CategoriaId` int NOT NULL,
    CONSTRAINT `PK_FilmCategorie` PRIMARY KEY (`FilmId`, `CategoriaId`),
    CONSTRAINT `FK_FilmCategorie_Categorie_CategoriaId` FOREIGN KEY (`CategoriaId`) REFERENCES `Categorie` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_FilmCategorie_Films_FilmId` FOREIGN KEY (`FilmId`) REFERENCES `Films` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE TABLE `Prenotazioni` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `UserId` int NOT NULL,
    `ProiezioneId` int NOT NULL,
    `NumeroPosti` int NOT NULL,
    `Note` varchar(500) CHARACTER SET utf8mb4 NULL,
    `DataPrenotazione` datetime(6) NOT NULL,
    CONSTRAINT `PK_Prenotazioni` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_Prenotazioni_Proiezioni_ProiezioneId` FOREIGN KEY (`ProiezioneId`) REFERENCES `Proiezioni` (`Id`) ON DELETE RESTRICT,
    CONSTRAINT `FK_Prenotazioni_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE TABLE `RefreshTokens` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `Token` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
    `UserId` int NOT NULL,
    `ExpiresAt` datetime(6) NOT NULL,
    `CreatedAt` datetime(6) NOT NULL,
    `RevokedAt` datetime(6) NULL,
    CONSTRAINT `PK_RefreshTokens` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_RefreshTokens_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE UNIQUE INDEX `IX_Categorie_Nome` ON `Categorie` (`Nome`);

CREATE INDEX `IX_FilmCategorie_CategoriaId` ON `FilmCategorie` (`CategoriaId`);

CREATE INDEX `IX_Prenotazioni_ProiezioneId` ON `Prenotazioni` (`ProiezioneId`);

CREATE INDEX `IX_Prenotazioni_UserId` ON `Prenotazioni` (`UserId`);

CREATE UNIQUE INDEX `IX_RefreshTokens_Token` ON `RefreshTokens` (`Token`);

CREATE INDEX `IX_RefreshTokens_UserId` ON `RefreshTokens` (`UserId`);

CREATE UNIQUE INDEX `IX_Users_Email` ON `Users` (`Email`);

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260406071504_AddCategorieAndAuth', '9.0.11');

ALTER TABLE `RefreshTokens` ADD `DeviceId` varchar(128) CHARACTER SET utf8mb4 NOT NULL DEFAULT 'web-default';

UPDATE RefreshTokens SET DeviceId = 'web-default' WHERE DeviceId = '';

CREATE INDEX `IX_RefreshTokens_UserId_DeviceId` ON `RefreshTokens` (`UserId`, `DeviceId`);

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260413200358_AddRefreshTokenDeviceId', '9.0.11');

ALTER TABLE `Users` ADD `CinemaPreferitoId` int NULL;

ALTER TABLE `Users` ADD `CreditoResiduo` decimal(10,2) NOT NULL DEFAULT 0.0;

ALTER TABLE `Films` ADD `CastText` varchar(2000) CHARACTER SET utf8mb4 NULL;

ALTER TABLE `Films` ADD `DataRilascio` date NULL;

ALTER TABLE `Films` ADD `DescrizioneLunga` varchar(2000) CHARACTER SET utf8mb4 NULL;

ALTER TABLE `Cinemas` ADD `CodiceLocale` varchar(50) CHARACTER SET utf8mb4 NULL;

ALTER TABLE `Cinemas` ADD `Latitudine` double NULL;

ALTER TABLE `Cinemas` ADD `Longitudine` double NULL;

ALTER TABLE `Cinemas` ADD `Telefono` varchar(20) CHARACTER SET utf8mb4 NULL;

CREATE TABLE `Sale` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `CinemaId` int NOT NULL,
    `NumeroProgressivo` int NOT NULL,
    `TipoSala` int NOT NULL,
    `Nome` varchar(100) CHARACTER SET utf8mb4 NULL,
    `Supplemento` decimal(10,2) NOT NULL,
    `IsAttiva` tinyint(1) NOT NULL,
    CONSTRAINT `PK_Sale` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_Sale_Cinemas_CinemaId` FOREIGN KEY (`CinemaId`) REFERENCES `Cinemas` (`Id`) ON DELETE RESTRICT
) CHARACTER SET=utf8mb4;

CREATE TABLE `SalaPosti` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `SalaId` int NOT NULL,
    `Settore` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `Fila` int NOT NULL,
    `Numero` int NOT NULL,
    `PosX` int NULL,
    `PosY` int NULL,
    `IsWheelchair` tinyint(1) NOT NULL,
    `IsAttivo` tinyint(1) NOT NULL,
    CONSTRAINT `PK_SalaPosti` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_SalaPosti_Sale_SalaId` FOREIGN KEY (`SalaId`) REFERENCES `Sale` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE TABLE `Shows` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `CinemaId` int NOT NULL,
    `SalaId` int NOT NULL,
    `FilmId` int NOT NULL,
    `StartAtUtc` datetime(6) NOT NULL,
    `DurataMinutiSnapshot` int NOT NULL,
    `PrezzoBase` decimal(10,2) NOT NULL,
    `SupplementoSala` decimal(10,2) NOT NULL,
    CONSTRAINT `PK_Shows` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_Shows_Cinemas_CinemaId` FOREIGN KEY (`CinemaId`) REFERENCES `Cinemas` (`Id`) ON DELETE RESTRICT,
    CONSTRAINT `FK_Shows_Films_FilmId` FOREIGN KEY (`FilmId`) REFERENCES `Films` (`Id`) ON DELETE RESTRICT,
    CONSTRAINT `FK_Shows_Sale_SalaId` FOREIGN KEY (`SalaId`) REFERENCES `Sale` (`Id`) ON DELETE RESTRICT
) CHARACTER SET=utf8mb4;

CREATE TABLE `Ordini` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `CodiceOrdine` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `UserId` int NOT NULL,
    `ShowId` int NOT NULL,
    `CinemaId` int NOT NULL,
    `SalaId` int NOT NULL,
    `FilmId` int NOT NULL,
    `HoldToken` varchar(120) CHARACTER SET utf8mb4 NOT NULL,
    `NumeroBiglietti` int NOT NULL,
    `TotaleLordo` decimal(10,2) NOT NULL,
    `ImportoCredito` decimal(10,2) NOT NULL,
    `ImportoCarta` decimal(10,2) NOT NULL,
    `StripePaymentIntentId` varchar(120) CHARACTER SET utf8mb4 NULL,
    `IdempotencyKey` varchar(120) CHARACTER SET utf8mb4 NULL,
    `Stato` int NOT NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    `PaidAtUtc` datetime(6) NULL,
    `TicketEmailSentAtUtc` datetime(6) NULL,
    `TicketEmailLastError` varchar(1000) CHARACTER SET utf8mb4 NULL,
    CONSTRAINT `PK_Ordini` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_Ordini_Cinemas_CinemaId` FOREIGN KEY (`CinemaId`) REFERENCES `Cinemas` (`Id`) ON DELETE RESTRICT,
    CONSTRAINT `FK_Ordini_Films_FilmId` FOREIGN KEY (`FilmId`) REFERENCES `Films` (`Id`) ON DELETE RESTRICT,
    CONSTRAINT `FK_Ordini_Sale_SalaId` FOREIGN KEY (`SalaId`) REFERENCES `Sale` (`Id`) ON DELETE RESTRICT,
    CONSTRAINT `FK_Ordini_Shows_ShowId` FOREIGN KEY (`ShowId`) REFERENCES `Shows` (`Id`) ON DELETE RESTRICT,
    CONSTRAINT `FK_Ordini_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`) ON DELETE RESTRICT
) CHARACTER SET=utf8mb4;

CREATE TABLE `Biglietti` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `OrdineId` int NOT NULL,
    `ShowId` int NOT NULL,
    `SalaPostoId` int NOT NULL,
    `UserId` int NOT NULL,
    `CodiceBiglietto` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `BarcodeValue` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `PrezzoBase` decimal(10,2) NOT NULL,
    `Supplemento` decimal(10,2) NOT NULL,
    `PrezzoTotale` decimal(10,2) NOT NULL,
    `Stato` int NOT NULL,
    `ValidatoAtUtc` datetime(6) NULL,
    `ValidatoDaUserId` int NULL,
    `ValidatoCinemaId` int NULL,
    CONSTRAINT `PK_Biglietti` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_Biglietti_Cinemas_ValidatoCinemaId` FOREIGN KEY (`ValidatoCinemaId`) REFERENCES `Cinemas` (`Id`) ON DELETE RESTRICT,
    CONSTRAINT `FK_Biglietti_Ordini_OrdineId` FOREIGN KEY (`OrdineId`) REFERENCES `Ordini` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_Biglietti_SalaPosti_SalaPostoId` FOREIGN KEY (`SalaPostoId`) REFERENCES `SalaPosti` (`Id`) ON DELETE RESTRICT,
    CONSTRAINT `FK_Biglietti_Shows_ShowId` FOREIGN KEY (`ShowId`) REFERENCES `Shows` (`Id`) ON DELETE RESTRICT,
    CONSTRAINT `FK_Biglietti_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`) ON DELETE RESTRICT,
    CONSTRAINT `FK_Biglietti_Users_ValidatoDaUserId` FOREIGN KEY (`ValidatoDaUserId`) REFERENCES `Users` (`Id`) ON DELETE RESTRICT
) CHARACTER SET=utf8mb4;

CREATE TABLE `MovimentiCredito` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `UserId` int NOT NULL,
    `Tipo` int NOT NULL,
    `Importo` decimal(10,2) NOT NULL,
    `SaldoPre` decimal(10,2) NOT NULL,
    `SaldoPost` decimal(10,2) NOT NULL,
    `OperatoreUserId` int NULL,
    `CinemaId` int NULL,
    `OrdineId` int NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    `Note` varchar(500) CHARACTER SET utf8mb4 NULL,
    CONSTRAINT `PK_MovimentiCredito` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_MovimentiCredito_Cinemas_CinemaId` FOREIGN KEY (`CinemaId`) REFERENCES `Cinemas` (`Id`) ON DELETE RESTRICT,
    CONSTRAINT `FK_MovimentiCredito_Ordini_OrdineId` FOREIGN KEY (`OrdineId`) REFERENCES `Ordini` (`Id`) ON DELETE RESTRICT,
    CONSTRAINT `FK_MovimentiCredito_Users_OperatoreUserId` FOREIGN KEY (`OperatoreUserId`) REFERENCES `Users` (`Id`) ON DELETE RESTRICT,
    CONSTRAINT `FK_MovimentiCredito_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`) ON DELETE RESTRICT
) CHARACTER SET=utf8mb4;

CREATE TABLE `ShowPostiStato` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `ShowId` int NOT NULL,
    `SalaPostoId` int NOT NULL,
    `UserId` int NOT NULL,
    `Stato` int NOT NULL,
    `HoldToken` varchar(120) CHARACTER SET utf8mb4 NULL,
    `ScadeAtUtc` datetime(6) NULL,
    `OrdineId` int NULL,
    `UpdatedAtUtc` datetime(6) NOT NULL,
    CONSTRAINT `PK_ShowPostiStato` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_ShowPostiStato_Ordini_OrdineId` FOREIGN KEY (`OrdineId`) REFERENCES `Ordini` (`Id`) ON DELETE RESTRICT,
    CONSTRAINT `FK_ShowPostiStato_SalaPosti_SalaPostoId` FOREIGN KEY (`SalaPostoId`) REFERENCES `SalaPosti` (`Id`) ON DELETE RESTRICT,
    CONSTRAINT `FK_ShowPostiStato_Shows_ShowId` FOREIGN KEY (`ShowId`) REFERENCES `Shows` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_ShowPostiStato_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`) ON DELETE RESTRICT
) CHARACTER SET=utf8mb4;

CREATE INDEX `IX_Users_CinemaPreferitoId` ON `Users` (`CinemaPreferitoId`);

CREATE UNIQUE INDEX `IX_Biglietti_CodiceBiglietto` ON `Biglietti` (`CodiceBiglietto`);

CREATE INDEX `IX_Biglietti_OrdineId` ON `Biglietti` (`OrdineId`);

CREATE INDEX `IX_Biglietti_SalaPostoId` ON `Biglietti` (`SalaPostoId`);

CREATE UNIQUE INDEX `IX_Biglietti_ShowId_SalaPostoId` ON `Biglietti` (`ShowId`, `SalaPostoId`);

CREATE INDEX `IX_Biglietti_UserId` ON `Biglietti` (`UserId`);

CREATE INDEX `IX_Biglietti_ValidatoCinemaId` ON `Biglietti` (`ValidatoCinemaId`);

CREATE INDEX `IX_Biglietti_ValidatoDaUserId` ON `Biglietti` (`ValidatoDaUserId`);

CREATE INDEX `IX_MovimentiCredito_CinemaId` ON `MovimentiCredito` (`CinemaId`);

CREATE INDEX `IX_MovimentiCredito_OperatoreUserId` ON `MovimentiCredito` (`OperatoreUserId`);

CREATE INDEX `IX_MovimentiCredito_OrdineId` ON `MovimentiCredito` (`OrdineId`);

CREATE INDEX `IX_MovimentiCredito_UserId` ON `MovimentiCredito` (`UserId`);

CREATE INDEX `IX_Ordini_CinemaId` ON `Ordini` (`CinemaId`);

CREATE UNIQUE INDEX `IX_Ordini_CodiceOrdine` ON `Ordini` (`CodiceOrdine`);

CREATE INDEX `IX_Ordini_FilmId` ON `Ordini` (`FilmId`);

CREATE UNIQUE INDEX `IX_Ordini_IdempotencyKey` ON `Ordini` (`IdempotencyKey`);

CREATE INDEX `IX_Ordini_SalaId` ON `Ordini` (`SalaId`);

CREATE INDEX `IX_Ordini_ShowId` ON `Ordini` (`ShowId`);

CREATE INDEX `IX_Ordini_UserId` ON `Ordini` (`UserId`);

CREATE UNIQUE INDEX `IX_SalaPosti_SalaId_Settore_Fila_Numero` ON `SalaPosti` (`SalaId`, `Settore`, `Fila`, `Numero`);

CREATE UNIQUE INDEX `IX_Sale_CinemaId_NumeroProgressivo` ON `Sale` (`CinemaId`, `NumeroProgressivo`);

CREATE INDEX `IX_ShowPostiStato_HoldToken` ON `ShowPostiStato` (`HoldToken`);

CREATE INDEX `IX_ShowPostiStato_OrdineId` ON `ShowPostiStato` (`OrdineId`);

CREATE INDEX `IX_ShowPostiStato_SalaPostoId` ON `ShowPostiStato` (`SalaPostoId`);

CREATE INDEX `IX_ShowPostiStato_ScadeAtUtc` ON `ShowPostiStato` (`ScadeAtUtc`);

CREATE UNIQUE INDEX `IX_ShowPostiStato_ShowId_SalaPostoId` ON `ShowPostiStato` (`ShowId`, `SalaPostoId`);

CREATE INDEX `IX_ShowPostiStato_UserId` ON `ShowPostiStato` (`UserId`);

CREATE UNIQUE INDEX `IX_Shows_CinemaId_SalaId_StartAtUtc` ON `Shows` (`CinemaId`, `SalaId`, `StartAtUtc`);

CREATE INDEX `IX_Shows_FilmId` ON `Shows` (`FilmId`);

CREATE INDEX `IX_Shows_SalaId` ON `Shows` (`SalaId`);

ALTER TABLE `Users` ADD CONSTRAINT `FK_Users_Cinemas_CinemaPreferitoId` FOREIGN KEY (`CinemaPreferitoId`) REFERENCES `Cinemas` (`Id`) ON DELETE SET NULL;


-- =====================================================
-- DATA MIGRATION: AddMultisalaTicketing
-- This handles:
-- 1. Backfill CreditoResiduo = 0 for existing users
-- 2. Create default 'Sala 1' for each cinema that doesn't have any sale
-- 3. Migrate legacy Proiezioni to Shows with conflict handling
-- =====================================================

-- 1. Backfill CreditoResiduo = 0 for existing users
UPDATE Users SET CreditoResiduo = 0 WHERE CreditoResiduo IS NULL;

-- 2. Create default 'Sala 1' for each cinema that doesn't have any sale
INSERT INTO Sale (CinemaId, NumeroProgressivo, TipoSala, Nome, Supplemento, IsAttiva)
SELECT c.Id, 1, 0, 'Sala 1', 0, true
FROM Cinemas c
WHERE NOT EXISTS (SELECT 1 FROM Sale s WHERE s.CinemaId = c.Id);

-- 3. Build legacy slots (StartAt + EndAt from Data/Ora + durata film)
DROP TEMPORARY TABLE IF EXISTS _LegacyProiezioni;
CREATE TEMPORARY TABLE _LegacyProiezioni (
    ProiezioneId INT NOT NULL PRIMARY KEY,
    CinemaId INT NOT NULL,
    FilmId INT NOT NULL,
    StartAtUtc DATETIME NOT NULL,
    EndAtUtc DATETIME NOT NULL,
    DurataMinuti INT NOT NULL
);

INSERT INTO _LegacyProiezioni (ProiezioneId, CinemaId, FilmId, StartAtUtc, EndAtUtc, DurataMinuti)
SELECT
    p.Id,
    p.CinemaId,
    p.FilmId,
    DATE_ADD(DATE(p.Data), INTERVAL TIME_TO_SEC(TIME(p.Ora)) SECOND) AS StartAtUtc,
    DATE_ADD(
        DATE_ADD(DATE(p.Data), INTERVAL TIME_TO_SEC(TIME(p.Ora)) SECOND),
        INTERVAL COALESCE(f.Durata, 120) MINUTE
    ) AS EndAtUtc,
    COALESCE(f.Durata, 120) AS DurataMinuti
FROM Proiezioni p
INNER JOIN Films f ON f.Id = p.FilmId;

-- 4. Mark overlaps/conflicts for Sala 1 assignment
DROP TEMPORARY TABLE IF EXISTS _LegacyConflitti;
CREATE TEMPORARY TABLE _LegacyConflitti (
    ProiezioneId INT NOT NULL PRIMARY KEY,
    CinemaId INT NOT NULL,
    FilmId INT NOT NULL,
    StartAtUtc DATETIME NOT NULL,
    DurataMinuti INT NOT NULL
);

INSERT INTO _LegacyConflitti (ProiezioneId, CinemaId, FilmId, StartAtUtc, DurataMinuti)
SELECT
    lp.ProiezioneId,
    lp.CinemaId,
    lp.FilmId,
    lp.StartAtUtc,
    lp.DurataMinuti
FROM _LegacyProiezioni lp
WHERE EXISTS (
    SELECT 1
    FROM _LegacyProiezioni lp2
    WHERE lp2.CinemaId = lp.CinemaId
      AND lp2.ProiezioneId <> lp.ProiezioneId
      AND lp.StartAtUtc < lp2.EndAtUtc
      AND lp.EndAtUtc > lp2.StartAtUtc
);

-- 5. Non-conflicting Proiezioni -> Sala 1
INSERT INTO Shows (CinemaId, SalaId, FilmId, StartAtUtc, DurataMinutiSnapshot, PrezzoBase, SupplementoSala)
SELECT
    lp.CinemaId,
    s1.Id AS SalaId,
    lp.FilmId,
    lp.StartAtUtc,
    lp.DurataMinuti,
    8.50,
    0
FROM _LegacyProiezioni lp
INNER JOIN Sale s1
    ON s1.CinemaId = lp.CinemaId
   AND s1.NumeroProgressivo = 1
LEFT JOIN _LegacyConflitti lc
    ON lc.ProiezioneId = lp.ProiezioneId
WHERE lc.ProiezioneId IS NULL
  AND NOT EXISTS (
      SELECT 1
      FROM Shows sh
      WHERE sh.CinemaId = lp.CinemaId
        AND sh.SalaId = s1.Id
        AND sh.StartAtUtc = lp.StartAtUtc
  );

-- 6. Conflicting Proiezioni -> auto-migrate salas (one sala per conflicting show)
DROP TEMPORARY TABLE IF EXISTS _LegacyAssegnazioniConflitti;
CREATE TEMPORARY TABLE _LegacyAssegnazioniConflitti (
    ProiezioneId INT NOT NULL PRIMARY KEY,
    CinemaId INT NOT NULL,
    FilmId INT NOT NULL,
    StartAtUtc DATETIME NOT NULL,
    DurataMinuti INT NOT NULL,
    NumeroProgressivo INT NOT NULL,
    KEY IX_Conflitti_Cinema_Numero (CinemaId, NumeroProgressivo)
);

INSERT INTO _LegacyAssegnazioniConflitti (ProiezioneId, CinemaId, FilmId, StartAtUtc, DurataMinuti, NumeroProgressivo)
SELECT
    lc.ProiezioneId,
    lc.CinemaId,
    lc.FilmId,
    lc.StartAtUtc,
    lc.DurataMinuti,
    base.MaxNumeroProgressivo + ROW_NUMBER() OVER (
        PARTITION BY lc.CinemaId
        ORDER BY lc.StartAtUtc, lc.ProiezioneId
    ) AS NumeroProgressivo
FROM _LegacyConflitti lc
INNER JOIN (
    SELECT c.Id AS CinemaId, COALESCE(MAX(s.NumeroProgressivo), 0) AS MaxNumeroProgressivo
    FROM Cinemas c
    LEFT JOIN Sale s ON s.CinemaId = c.Id
    GROUP BY c.Id
) base ON base.CinemaId = lc.CinemaId;

INSERT INTO Sale (CinemaId, NumeroProgressivo, TipoSala, Nome, Supplemento, IsAttiva)
SELECT
    ac.CinemaId,
    ac.NumeroProgressivo,
    0,
    CONCAT('Sala auto-migrata ', ac.NumeroProgressivo),
    0,
    true
FROM _LegacyAssegnazioniConflitti ac
LEFT JOIN Sale s
    ON s.CinemaId = ac.CinemaId
   AND s.NumeroProgressivo = ac.NumeroProgressivo
WHERE s.Id IS NULL;

INSERT INTO Shows (CinemaId, SalaId, FilmId, StartAtUtc, DurataMinutiSnapshot, PrezzoBase, SupplementoSala)
SELECT
    ac.CinemaId,
    s.Id AS SalaId,
    ac.FilmId,
    ac.StartAtUtc,
    ac.DurataMinuti,
    8.50,
    0
FROM _LegacyAssegnazioniConflitti ac
INNER JOIN Sale s
    ON s.CinemaId = ac.CinemaId
   AND s.NumeroProgressivo = ac.NumeroProgressivo
WHERE NOT EXISTS (
    SELECT 1
    FROM Shows sh
    WHERE sh.CinemaId = ac.CinemaId
      AND sh.SalaId = s.Id
      AND sh.StartAtUtc = ac.StartAtUtc
);

DROP TEMPORARY TABLE IF EXISTS _LegacyAssegnazioniConflitti;
DROP TEMPORARY TABLE IF EXISTS _LegacyConflitti;
DROP TEMPORARY TABLE IF EXISTS _LegacyProiezioni;


INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260416171534_AddMultisalaTicketing', '9.0.11');

ALTER TABLE `Ordini` ADD `CheckoutCompletedAtUtc` datetime(6) NULL;

ALTER TABLE `Ordini` ADD `CheckoutExpiresAtUtc` datetime(6) NULL;

ALTER TABLE `Ordini` ADD `CreditoRiservato` decimal(10,2) NOT NULL DEFAULT 0.0;

ALTER TABLE `Ordini` ADD `LastPaymentError` varchar(1000) CHARACTER SET utf8mb4 NULL;

ALTER TABLE `Ordini` ADD `StripeCheckoutSessionId` varchar(120) CHARACTER SET utf8mb4 NULL;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260419152609_AddStripeCheckoutFieldsToOrdine', '9.0.11');

CREATE TABLE `SupportConversations` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `UserId` int NOT NULL,
    `Status` int NOT NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    `UpdatedAtUtc` datetime(6) NOT NULL,
    CONSTRAINT `PK_SupportConversations` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_SupportConversations_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE TABLE `SupportMessages` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `ConversationId` int NOT NULL,
    `UserId` int NOT NULL,
    `Role` int NOT NULL,
    `Message` varchar(4000) CHARACTER SET utf8mb4 NOT NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    CONSTRAINT `PK_SupportMessages` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_SupportMessages_SupportConversations_ConversationId` FOREIGN KEY (`ConversationId`) REFERENCES `SupportConversations` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_SupportMessages_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`) ON DELETE RESTRICT
) CHARACTER SET=utf8mb4;

CREATE TABLE `SupportTickets` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `Code` varchar(40) CHARACTER SET utf8mb4 NOT NULL,
    `ConversationId` int NOT NULL,
    `UserId` int NOT NULL,
    `Title` varchar(180) CHARACTER SET utf8mb4 NOT NULL,
    `Description` varchar(5000) CHARACTER SET utf8mb4 NOT NULL,
    `Status` int NOT NULL,
    `Priority` int NOT NULL,
    `ContextPage` varchar(200) CHARACTER SET utf8mb4 NULL,
    `ContextOrderCode` varchar(120) CHARACTER SET utf8mb4 NULL,
    `ContextMetadata` varchar(2000) CHARACTER SET utf8mb4 NULL,
    `AdminResolutionNote` varchar(1500) CHARACTER SET utf8mb4 NULL,
    `AssignedAdminUserId` int NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    `UpdatedAtUtc` datetime(6) NOT NULL,
    `ResolvedAtUtc` datetime(6) NULL,
    CONSTRAINT `PK_SupportTickets` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_SupportTickets_SupportConversations_ConversationId` FOREIGN KEY (`ConversationId`) REFERENCES `SupportConversations` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_SupportTickets_Users_AssignedAdminUserId` FOREIGN KEY (`AssignedAdminUserId`) REFERENCES `Users` (`Id`) ON DELETE SET NULL,
    CONSTRAINT `FK_SupportTickets_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`) ON DELETE RESTRICT
) CHARACTER SET=utf8mb4;

CREATE INDEX `IX_SupportConversations_UpdatedAtUtc` ON `SupportConversations` (`UpdatedAtUtc`);

CREATE INDEX `IX_SupportConversations_UserId` ON `SupportConversations` (`UserId`);

CREATE INDEX `IX_SupportMessages_ConversationId` ON `SupportMessages` (`ConversationId`);

CREATE INDEX `IX_SupportMessages_CreatedAtUtc` ON `SupportMessages` (`CreatedAtUtc`);

CREATE INDEX `IX_SupportMessages_UserId` ON `SupportMessages` (`UserId`);

CREATE INDEX `IX_SupportTickets_AssignedAdminUserId` ON `SupportTickets` (`AssignedAdminUserId`);

CREATE UNIQUE INDEX `IX_SupportTickets_Code` ON `SupportTickets` (`Code`);

CREATE INDEX `IX_SupportTickets_ConversationId` ON `SupportTickets` (`ConversationId`);

CREATE INDEX `IX_SupportTickets_Status` ON `SupportTickets` (`Status`);

CREATE INDEX `IX_SupportTickets_UpdatedAtUtc` ON `SupportTickets` (`UpdatedAtUtc`);

CREATE INDEX `IX_SupportTickets_UserId` ON `SupportTickets` (`UserId`);

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260427133856_AddSupportChatAndTickets', '9.0.11');

CREATE TABLE `SupportTicketAudits` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `TicketId` int NOT NULL,
    `ActorUserId` int NULL,
    `EventType` varchar(60) CHARACTER SET utf8mb4 NOT NULL,
    `Message` varchar(1200) CHARACTER SET utf8mb4 NOT NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    CONSTRAINT `PK_SupportTicketAudits` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_SupportTicketAudits_SupportTickets_TicketId` FOREIGN KEY (`TicketId`) REFERENCES `SupportTickets` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_SupportTicketAudits_Users_ActorUserId` FOREIGN KEY (`ActorUserId`) REFERENCES `Users` (`Id`) ON DELETE SET NULL
) CHARACTER SET=utf8mb4;

CREATE INDEX `IX_SupportTicketAudits_ActorUserId` ON `SupportTicketAudits` (`ActorUserId`);

CREATE INDEX `IX_SupportTicketAudits_CreatedAtUtc` ON `SupportTicketAudits` (`CreatedAtUtc`);

CREATE INDEX `IX_SupportTicketAudits_TicketId` ON `SupportTicketAudits` (`TicketId`);

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260427135225_AddSupportTicketAuditLog', '9.0.11');

ALTER TABLE `ShowPostiStato` ADD `RowVersion` datetime(6) NOT NULL DEFAULT '0001-01-01 00:00:00' ON UPDATE CURRENT_TIMESTAMP(6);

ALTER TABLE `Ordini` ADD `RowVersion` datetime(6) NOT NULL DEFAULT '0001-01-01 00:00:00' ON UPDATE CURRENT_TIMESTAMP(6);

CREATE INDEX `IX_Shows_StartAtUtc` ON `Shows` (`StartAtUtc`);

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260428093932_AddConcurrencyAndMissingIndexes', '9.0.11');

CREATE TABLE `Promotions` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `Title` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
    `Description` varchar(2000) CHARACTER SET utf8mb4 NOT NULL,
    `ImagePath` varchar(500) CHARACTER SET utf8mb4 NULL,
    `LinkUrl` varchar(300) CHARACTER SET utf8mb4 NULL,
    `Type` int NOT NULL,
    `Price` decimal(10,2) NULL,
    `Active` tinyint(1) NOT NULL,
    `Priority` int NOT NULL,
    `StartDate` datetime(6) NULL,
    `EndDate` datetime(6) NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    `UpdatedAtUtc` datetime(6) NOT NULL,
    CONSTRAINT `PK_Promotions` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;

CREATE INDEX `IX_Promotions_Active` ON `Promotions` (`Active`);

CREATE INDEX `IX_Promotions_Priority` ON `Promotions` (`Priority`);

CREATE INDEX `IX_Promotions_StartDate` ON `Promotions` (`StartDate`);

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260430114707_AddPromotions', '9.0.11');

CREATE TABLE `PasswordResetTokens` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `UserId` int NOT NULL,
    `Token` varchar(128) CHARACTER SET utf8mb4 NOT NULL,
    `ExpiresAtUtc` datetime(6) NOT NULL,
    `Used` tinyint(1) NOT NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    CONSTRAINT `PK_PasswordResetTokens` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_PasswordResetTokens_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE INDEX `IX_PasswordResetTokens_ExpiresAtUtc` ON `PasswordResetTokens` (`ExpiresAtUtc`);

CREATE UNIQUE INDEX `IX_PasswordResetTokens_Token` ON `PasswordResetTokens` (`Token`);

CREATE INDEX `IX_PasswordResetTokens_UserId` ON `PasswordResetTokens` (`UserId`);

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260505095024_AddPasswordResetAndRecovery', '9.0.11');

ALTER TABLE `Users` ADD `AuthVersion` int NOT NULL DEFAULT 0;

ALTER TABLE `Users` ADD `LocalCredentialsEnabled` tinyint(1) NOT NULL DEFAULT FALSE;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260506083318_AddSecurityFieldsToUser', '9.0.11');

CREATE TABLE `GiftCards` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `Codice` varchar(30) CHARACTER SET utf8mb4 NOT NULL,
    `ValoreIniziale` decimal(10,2) NOT NULL,
    `SaldoResiduo` decimal(10,2) NOT NULL,
    `Stato` int NOT NULL,
    `AcquirenteUserId` int NULL,
    `RiscattataDaUserId` int NULL,
    `OrdineId` int NULL,
    `DataAcquisto` datetime(6) NOT NULL,
    `DataRiscatto` datetime(6) NULL,
    `DataScadenza` datetime(6) NOT NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    `Note` varchar(500) CHARACTER SET utf8mb4 NULL,
    CONSTRAINT `PK_GiftCards` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_GiftCards_Ordini_OrdineId` FOREIGN KEY (`OrdineId`) REFERENCES `Ordini` (`Id`) ON DELETE RESTRICT,
    CONSTRAINT `FK_GiftCards_Users_AcquirenteUserId` FOREIGN KEY (`AcquirenteUserId`) REFERENCES `Users` (`Id`) ON DELETE RESTRICT,
    CONSTRAINT `FK_GiftCards_Users_RiscattataDaUserId` FOREIGN KEY (`RiscattataDaUserId`) REFERENCES `Users` (`Id`) ON DELETE RESTRICT
) CHARACTER SET=utf8mb4;

CREATE INDEX `IX_GiftCards_AcquirenteUserId` ON `GiftCards` (`AcquirenteUserId`);

CREATE UNIQUE INDEX `IX_GiftCards_Codice` ON `GiftCards` (`Codice`);

CREATE INDEX `IX_GiftCards_OrdineId` ON `GiftCards` (`OrdineId`);

CREATE INDEX `IX_GiftCards_RiscattataDaUserId` ON `GiftCards` (`RiscattataDaUserId`);

CREATE INDEX `IX_GiftCards_Stato` ON `GiftCards` (`Stato`);

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260507191212_GiftCard', '9.0.11');

ALTER TABLE `GiftCards` ADD `DataInvioProgrammato` datetime(6) NULL;

ALTER TABLE `GiftCards` ADD `DestinatarioEmail` varchar(255) CHARACTER SET utf8mb4 NULL;

ALTER TABLE `GiftCards` ADD `InviataIl` datetime(6) NULL;

ALTER TABLE `GiftCards` ADD `Messaggio` varchar(500) CHARACTER SET utf8mb4 NULL;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260508115212_GiftCardV2', '9.0.11');

CREATE TABLE `MembershipCards` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `UserId` int NOT NULL,
    `CardNumber` varchar(30) CHARACTER SET utf8mb4 NOT NULL,
    `Tier` int NOT NULL,
    `PuntiTotali` decimal(10,2) NOT NULL,
    `PuntiDisponibili` decimal(10,2) NOT NULL,
    `DataIscrizione` datetime(6) NOT NULL,
    `QrCodeData` varchar(200) CHARACTER SET utf8mb4 NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    CONSTRAINT `PK_MembershipCards` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_MembershipCards_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE TABLE `Premi` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `Nome` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
    `Descrizione` varchar(500) CHARACTER SET utf8mb4 NULL,
    `CostoPunti` decimal(10,2) NOT NULL,
    `Tipo` int NOT NULL,
    `Valore` decimal(10,2) NOT NULL,
    `Attivo` tinyint(1) NOT NULL,
    `QuantitaDisponibile` int NOT NULL,
    `ImmaginePath` varchar(500) CHARACTER SET utf8mb4 NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    CONSTRAINT `PK_Premi` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;

CREATE TABLE `PuntiMovimenti` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `UserId` int NOT NULL,
    `MembershipCardId` int NULL,
    `Tipo` int NOT NULL,
    `Punti` decimal(10,2) NOT NULL,
    `SaldoPre` decimal(10,2) NOT NULL,
    `SaldoPost` decimal(10,2) NOT NULL,
    `RiferimentoId` int NULL,
    `RiferimentoTipo` varchar(50) CHARACTER SET utf8mb4 NULL,
    `Note` varchar(500) CHARACTER SET utf8mb4 NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    CONSTRAINT `PK_PuntiMovimenti` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_PuntiMovimenti_MembershipCards_MembershipCardId` FOREIGN KEY (`MembershipCardId`) REFERENCES `MembershipCards` (`Id`) ON DELETE SET NULL,
    CONSTRAINT `FK_PuntiMovimenti_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`) ON DELETE RESTRICT
) CHARACTER SET=utf8mb4;

CREATE TABLE `PremiRiscatti` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `UserId` int NOT NULL,
    `PremioId` int NOT NULL,
    `PuntiSpesi` decimal(10,2) NOT NULL,
    `Codice` varchar(30) CHARACTER SET utf8mb4 NOT NULL,
    `Stato` int NOT NULL,
    `DataRiscatto` datetime(6) NOT NULL,
    `DataScadenza` datetime(6) NULL,
    `DataUtilizzo` datetime(6) NULL,
    `Note` varchar(500) CHARACTER SET utf8mb4 NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    CONSTRAINT `PK_PremiRiscatti` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_PremiRiscatti_Premi_PremioId` FOREIGN KEY (`PremioId`) REFERENCES `Premi` (`Id`) ON DELETE RESTRICT,
    CONSTRAINT `FK_PremiRiscatti_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`) ON DELETE RESTRICT
) CHARACTER SET=utf8mb4;

CREATE UNIQUE INDEX `IX_MembershipCards_CardNumber` ON `MembershipCards` (`CardNumber`);

CREATE UNIQUE INDEX `IX_MembershipCards_UserId` ON `MembershipCards` (`UserId`);

CREATE INDEX `IX_Premi_Attivo` ON `Premi` (`Attivo`);

CREATE UNIQUE INDEX `IX_PremiRiscatti_Codice` ON `PremiRiscatti` (`Codice`);

CREATE INDEX `IX_PremiRiscatti_PremioId` ON `PremiRiscatti` (`PremioId`);

CREATE INDEX `IX_PremiRiscatti_UserId` ON `PremiRiscatti` (`UserId`);

CREATE INDEX `IX_PuntiMovimenti_CreatedAtUtc` ON `PuntiMovimenti` (`CreatedAtUtc`);

CREATE INDEX `IX_PuntiMovimenti_MembershipCardId` ON `PuntiMovimenti` (`MembershipCardId`);

CREATE INDEX `IX_PuntiMovimenti_UserId` ON `PuntiMovimenti` (`UserId`);

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260508135411_Membership', '9.0.11');

ALTER TABLE `MembershipCards` ADD `AttivataIl` datetime(6) NULL;

ALTER TABLE `MembershipCards` ADD `DataScadenzaAbbonamento` datetime(6) NULL;

ALTER TABLE `MembershipCards` ADD `IsAttiva` tinyint(1) NOT NULL DEFAULT FALSE;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260508141758_MembershipV2', '9.0.11');

CREATE TABLE `NewsletterSubscribers` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `Email` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
    `CodiceSconto` varchar(30) CHARACTER SET utf8mb4 NOT NULL,
    `ScontoUsato` tinyint(1) NOT NULL,
    `IscrittoIl` datetime(6) NOT NULL,
    CONSTRAINT `PK_NewsletterSubscribers` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;

CREATE UNIQUE INDEX `IX_NewsletterSubscribers_CodiceSconto` ON `NewsletterSubscribers` (`CodiceSconto`);

CREATE UNIQUE INDEX `IX_NewsletterSubscribers_Email` ON `NewsletterSubscribers` (`Email`);

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260508150600_Newsletter', '9.0.11');

CREATE TABLE `NewsletterScheduleds` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `Oggetto` varchar(200) CHARACTER SET utf8mb4 NOT NULL,
    `Contenuto` longtext CHARACTER SET utf8mb4 NOT NULL,
    `ScheduledAt` datetime(6) NULL,
    `SentAt` datetime(6) NULL,
    `Inviati` int NOT NULL,
    `Totale` int NOT NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    CONSTRAINT `PK_NewsletterScheduleds` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260508153256_NewsletterV2', '9.0.11');

ALTER TABLE `MembershipCards` ADD `Cap` varchar(10) CHARACTER SET utf8mb4 NULL;

ALTER TABLE `MembershipCards` ADD `Citta` varchar(100) CHARACTER SET utf8mb4 NULL;

ALTER TABLE `MembershipCards` ADD `DataNascita` datetime(6) NULL;

ALTER TABLE `MembershipCards` ADD `Provincia` varchar(5) CHARACTER SET utf8mb4 NULL;

ALTER TABLE `MembershipCards` ADD `Via` varchar(200) CHARACTER SET utf8mb4 NULL;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260509081605_MembershipProfile', '9.0.11');

CREATE TABLE `CampaignConfigs` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `Tipo` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `Nome` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `Attiva` tinyint(1) NOT NULL,
    `PercentualeSconto` int NOT NULL,
    `MessaggioPersonalizzato` varchar(1000) CHARACTER SET utf8mb4 NULL,
    `UltimaEsecuzione` datetime(6) NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    CONSTRAINT `PK_CampaignConfigs` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260509083218_CampaignConfig', '9.0.11');

ALTER TABLE `CampaignConfigs` ADD `GiorniPrima` int NOT NULL DEFAULT 0;

ALTER TABLE `CampaignConfigs` ADD `Giorno` int NULL;

ALTER TABLE `CampaignConfigs` ADD `Mese` int NULL;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260509084759_CampaignDate', '9.0.11');

ALTER TABLE `Promotions` ADD `DiscountCode` varchar(30) CHARACTER SET utf8mb4 NULL;

ALTER TABLE `Promotions` ADD `DiscountPercent` int NULL;

ALTER TABLE `Promotions` ADD `MaxUsage` int NULL;

ALTER TABLE `Promotions` ADD `UsageCount` int NOT NULL DEFAULT 0;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260509154248_PromotionDiscount', '9.0.11');

ALTER TABLE `Ordini` ADD `DiscountCode` varchar(30) CHARACTER SET utf8mb4 NULL;

ALTER TABLE `Ordini` ADD `ScontoPercent` int NULL;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260509185917_OrderDiscount', '9.0.11');

CREATE TABLE `PartyBookings` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `UserId` int NOT NULL,
    `CinemaId` int NOT NULL,
    `FilmId` int NULL,
    `NomeFesta` varchar(200) CHARACTER SET utf8mb4 NULL,
    `Tipo` int NOT NULL,
    `Pacchetto` int NOT NULL,
    `NumeroOspiti` int NOT NULL,
    `DataEvento` datetime(6) NOT NULL,
    `RichiesteSpeciali` varchar(1000) CHARACTER SET utf8mb4 NULL,
    `Totale` decimal(10,2) NOT NULL,
    `Stato` int NOT NULL,
    `ConfermatoIl` datetime(6) NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    CONSTRAINT `PK_PartyBookings` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_PartyBookings_Cinemas_CinemaId` FOREIGN KEY (`CinemaId`) REFERENCES `Cinemas` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_PartyBookings_Films_FilmId` FOREIGN KEY (`FilmId`) REFERENCES `Films` (`Id`),
    CONSTRAINT `FK_PartyBookings_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE INDEX `IX_PartyBookings_CinemaId` ON `PartyBookings` (`CinemaId`);

CREATE INDEX `IX_PartyBookings_FilmId` ON `PartyBookings` (`FilmId`);

CREATE INDEX `IX_PartyBookings_UserId` ON `PartyBookings` (`UserId`);

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260510080515_PartyBooking', '9.0.11');

ALTER TABLE `PartyBookings` ADD `OraFine` datetime(6) NOT NULL DEFAULT '0001-01-01 00:00:00';

ALTER TABLE `PartyBookings` ADD `OraInizio` datetime(6) NOT NULL DEFAULT '0001-01-01 00:00:00';

ALTER TABLE `PartyBookings` ADD `OrdineId` int NULL;

CREATE INDEX `IX_PartyBookings_OrdineId` ON `PartyBookings` (`OrdineId`);

ALTER TABLE `PartyBookings` ADD CONSTRAINT `FK_PartyBookings_Ordini_OrdineId` FOREIGN KEY (`OrdineId`) REFERENCES `Ordini` (`Id`);

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260510083737_PartyV2', '9.0.11');

ALTER TABLE `PartyBookings` ADD `CompletatoIl` datetime(6) NULL;

ALTER TABLE `PartyBookings` ADD `QrCodeData` varchar(500) CHARACTER SET utf8mb4 NULL;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260510183928_PartyQr', '9.0.11');

CREATE TABLE `PartyFeedbacks` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `PartyBookingId` int NOT NULL,
    `Rating` int NOT NULL,
    `Comment` varchar(1000) CHARACTER SET utf8mb4 NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    CONSTRAINT `PK_PartyFeedbacks` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_PartyFeedbacks_PartyBookings_PartyBookingId` FOREIGN KEY (`PartyBookingId`) REFERENCES `PartyBookings` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE INDEX `IX_PartyFeedbacks_PartyBookingId` ON `PartyFeedbacks` (`PartyBookingId`);

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260510190247_PartyFeedback', '9.0.11');

ALTER TABLE `Shows` ADD `State` int NOT NULL DEFAULT 0;

CREATE TABLE `ShowCancellations` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `ShowId` int NOT NULL,
    `CancelledByUserId` int NOT NULL,
    `CancelledAtUtc` datetime(6) NOT NULL,
    `Reason` varchar(1000) CHARACTER SET utf8mb4 NULL,
    `Status` int NOT NULL,
    `TotaleDaRimborsare` decimal(10,2) NOT NULL,
    `TotaleCarta` decimal(10,2) NOT NULL,
    `TotaleCredito` decimal(10,2) NOT NULL,
    `OrdiniTotali` int NOT NULL,
    `BigliettiTotali` int NOT NULL,
    `RimborsiRiusciti` int NOT NULL,
    `RimborsiFalliti` int NOT NULL,
    `ManualReviewCount` int NOT NULL,
    `EmailsInviate` tinyint(1) NOT NULL,
    `EmailsInviateIl` datetime(6) NULL,
    `ErrorMessage` varchar(1000) CHARACTER SET utf8mb4 NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    CONSTRAINT `PK_ShowCancellations` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_ShowCancellations_Shows_ShowId` FOREIGN KEY (`ShowId`) REFERENCES `Shows` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_ShowCancellations_Users_CancelledByUserId` FOREIGN KEY (`CancelledByUserId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE TABLE `ManualRefundReviews` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `OrdineId` int NOT NULL,
    `ShowCancellationId` int NOT NULL,
    `ReasonCode` int NOT NULL,
    `Importo` decimal(10,2) NOT NULL,
    `Resolution` int NULL,
    `ResolutionNotes` varchar(1000) CHARACTER SET utf8mb4 NULL,
    `ResolvedByUserId` int NULL,
    `ResolvedAtUtc` datetime(6) NULL,
    `Details` varchar(1000) CHARACTER SET utf8mb4 NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    CONSTRAINT `PK_ManualRefundReviews` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_ManualRefundReviews_Ordini_OrdineId` FOREIGN KEY (`OrdineId`) REFERENCES `Ordini` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_ManualRefundReviews_ShowCancellations_ShowCancellationId` FOREIGN KEY (`ShowCancellationId`) REFERENCES `ShowCancellations` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_ManualRefundReviews_Users_ResolvedByUserId` FOREIGN KEY (`ResolvedByUserId`) REFERENCES `Users` (`Id`)
) CHARACTER SET=utf8mb4;

CREATE TABLE `OrdineRefunds` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `OrdineId` int NOT NULL,
    `ShowCancellationId` int NOT NULL,
    `ImportoCarta` decimal(10,2) NOT NULL,
    `ImportoCredito` decimal(10,2) NOT NULL,
    `StripeRefundId` longtext CHARACTER SET utf8mb4 NULL,
    `StripeRefundStatus` varchar(50) CHARACTER SET utf8mb4 NULL,
    `CreditRefundMovementId` int NULL,
    `Status` int NOT NULL,
    `ErrorMessage` varchar(1000) CHARACTER SET utf8mb4 NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    `CompletedAtUtc` datetime(6) NULL,
    CONSTRAINT `PK_OrdineRefunds` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_OrdineRefunds_Ordini_OrdineId` FOREIGN KEY (`OrdineId`) REFERENCES `Ordini` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_OrdineRefunds_ShowCancellations_ShowCancellationId` FOREIGN KEY (`ShowCancellationId`) REFERENCES `ShowCancellations` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE INDEX `IX_ManualRefundReviews_OrdineId` ON `ManualRefundReviews` (`OrdineId`);

CREATE INDEX `IX_ManualRefundReviews_ResolvedByUserId` ON `ManualRefundReviews` (`ResolvedByUserId`);

CREATE INDEX `IX_ManualRefundReviews_ShowCancellationId` ON `ManualRefundReviews` (`ShowCancellationId`);

CREATE INDEX `IX_OrdineRefunds_OrdineId` ON `OrdineRefunds` (`OrdineId`);

CREATE INDEX `IX_OrdineRefunds_ShowCancellationId` ON `OrdineRefunds` (`ShowCancellationId`);

CREATE INDEX `IX_ShowCancellations_CancelledByUserId` ON `ShowCancellations` (`CancelledByUserId`);

CREATE INDEX `IX_ShowCancellations_ShowId` ON `ShowCancellations` (`ShowId`);

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260511101546_ShowCancellation', '9.0.11');

ALTER TABLE `Users` ADD `AnonymizedAtUtc` datetime(6) NULL;

ALTER TABLE `Users` ADD `IsDisabled` tinyint(1) NOT NULL DEFAULT FALSE;

ALTER TABLE `Users` ADD `LastLoginAtUtc` datetime(6) NULL;

ALTER TABLE `Users` ADD `LastLoginProvider` varchar(30) CHARACTER SET utf8mb4 NULL;

CREATE TABLE `UserCinemaAssignments` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `UserId` int NOT NULL,
    `CinemaId` int NOT NULL,
    `CanValidateTickets` tinyint(1) NOT NULL,
    `CanTopUpCredit` tinyint(1) NOT NULL,
    `CanManageShows` tinyint(1) NOT NULL,
    `IsActive` tinyint(1) NOT NULL,
    `CreatedByUserId` int NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    `UpdatedAtUtc` datetime(6) NULL,
    `RevokedAtUtc` datetime(6) NULL,
    `Notes` varchar(500) CHARACTER SET utf8mb4 NULL,
    CONSTRAINT `PK_UserCinemaAssignments` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_UserCinemaAssignments_Cinemas_CinemaId` FOREIGN KEY (`CinemaId`) REFERENCES `Cinemas` (`Id`) ON DELETE RESTRICT,
    CONSTRAINT `FK_UserCinemaAssignments_Users_CreatedByUserId` FOREIGN KEY (`CreatedByUserId`) REFERENCES `Users` (`Id`) ON DELETE SET NULL,
    CONSTRAINT `FK_UserCinemaAssignments_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`) ON DELETE RESTRICT
) CHARACTER SET=utf8mb4;

CREATE INDEX `IX_UserCinemaAssignments_CinemaId` ON `UserCinemaAssignments` (`CinemaId`);

CREATE INDEX `IX_UserCinemaAssignments_CreatedByUserId` ON `UserCinemaAssignments` (`CreatedByUserId`);

CREATE INDEX `IX_UserCinemaAssignments_UserId` ON `UserCinemaAssignments` (`UserId`);

CREATE UNIQUE INDEX `IX_UserCinemaAssignments_UserId_CinemaId` ON `UserCinemaAssignments` (`UserId`, `CinemaId`);

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260511102206_CinemaStaff', '9.0.11');

ALTER TABLE `Users` ADD `AnonymizedAtUtc` datetime(6) NULL;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260511102904_GDPR', '9.0.11');

ALTER TABLE `ShowPostiStato` ADD `TicketType` int NULL;

ALTER TABLE `Biglietti` ADD `TipoBiglietto` int NOT NULL DEFAULT 0;

CREATE TABLE `FoodItems` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `Nome` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `Descrizione` varchar(300) CHARACTER SET utf8mb4 NULL,
    `Prezzo` decimal(10,2) NOT NULL,
    `Categoria` varchar(30) CHARACTER SET utf8mb4 NOT NULL,
    `ImmaginePath` varchar(500) CHARACTER SET utf8mb4 NULL,
    `Attivo` tinyint(1) NOT NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    CONSTRAINT `PK_FoodItems` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;

CREATE TABLE `MerchItems` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `Nome` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
    `Descrizione` varchar(500) CHARACTER SET utf8mb4 NULL,
    `Prezzo` decimal(10,2) NOT NULL,
    `Categoria` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `ImmaginePath` varchar(500) CHARACTER SET utf8mb4 NULL,
    `Stock` int NOT NULL,
    `Attivo` tinyint(1) NOT NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    CONSTRAINT `PK_MerchItems` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;

CREATE TABLE `MerchOrders` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `UserId` int NOT NULL,
    `Totale` decimal(10,2) NOT NULL,
    `Stato` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `CodiceOrdine` varchar(30) CHARACTER SET utf8mb4 NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    CONSTRAINT `PK_MerchOrders` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_MerchOrders_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`) ON DELETE RESTRICT
) CHARACTER SET=utf8mb4;

CREATE TABLE `ReferralCodes` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `UserId` int NOT NULL,
    `Code` varchar(30) CHARACTER SET utf8mb4 NOT NULL,
    `DiscountPercent` int NOT NULL,
    `UsageCount` int NOT NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    CONSTRAINT `PK_ReferralCodes` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_ReferralCodes_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE TABLE `FoodOrderItems` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `OrdineId` int NOT NULL,
    `FoodItemId` int NOT NULL,
    `Quantita` int NOT NULL,
    `PrezzoUnitario` decimal(10,2) NOT NULL,
    CONSTRAINT `PK_FoodOrderItems` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_FoodOrderItems_FoodItems_FoodItemId` FOREIGN KEY (`FoodItemId`) REFERENCES `FoodItems` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_FoodOrderItems_Ordini_OrdineId` FOREIGN KEY (`OrdineId`) REFERENCES `Ordini` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE TABLE `MerchOrderItems` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `MerchOrderId` int NOT NULL,
    `MerchItemId` int NOT NULL,
    `Quantita` int NOT NULL,
    `PrezzoUnitario` decimal(10,2) NOT NULL,
    CONSTRAINT `PK_MerchOrderItems` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_MerchOrderItems_MerchItems_MerchItemId` FOREIGN KEY (`MerchItemId`) REFERENCES `MerchItems` (`Id`) ON DELETE RESTRICT,
    CONSTRAINT `FK_MerchOrderItems_MerchOrders_MerchOrderId` FOREIGN KEY (`MerchOrderId`) REFERENCES `MerchOrders` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE INDEX `IX_FoodOrderItems_FoodItemId` ON `FoodOrderItems` (`FoodItemId`);

CREATE INDEX `IX_FoodOrderItems_OrdineId` ON `FoodOrderItems` (`OrdineId`);

CREATE INDEX `IX_MerchItems_Nome` ON `MerchItems` (`Nome`);

CREATE INDEX `IX_MerchOrderItems_MerchItemId` ON `MerchOrderItems` (`MerchItemId`);

CREATE UNIQUE INDEX `IX_MerchOrderItems_MerchOrderId_MerchItemId` ON `MerchOrderItems` (`MerchOrderId`, `MerchItemId`);

CREATE UNIQUE INDEX `IX_MerchOrders_CodiceOrdine` ON `MerchOrders` (`CodiceOrdine`);

CREATE INDEX `IX_MerchOrders_UserId` ON `MerchOrders` (`UserId`);

CREATE INDEX `IX_ReferralCodes_UserId` ON `ReferralCodes` (`UserId`);

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260512085650_TicketTypes', '9.0.11');

ALTER TABLE `FoodOrderItems` DROP FOREIGN KEY `FK_FoodOrderItems_FoodItems_FoodItemId`;

CREATE UNIQUE INDEX `IX_ReferralCodes_Code` ON `ReferralCodes` (`Code`);

ALTER TABLE `FoodOrderItems` ADD CONSTRAINT `FK_FoodOrderItems_FoodItems_FoodItemId` FOREIGN KEY (`FoodItemId`) REFERENCES `FoodItems` (`Id`) ON DELETE RESTRICT;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260512085806_FoodBeverage', '9.0.11');

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260512085830_AddReferralCode', '9.0.11');

ALTER TABLE `PartyBookings` ADD `StripePaymentIntentId` varchar(100) CHARACTER SET utf8mb4 NULL;

ALTER TABLE `MovimentiCredito` ADD `MerchOrderId` int NULL;

ALTER TABLE `MerchOrders` ADD `CAP` varchar(10) CHARACTER SET utf8mb4 NULL;

ALTER TABLE `MerchOrders` ADD `CheckoutExpiresAtUtc` datetime(6) NULL;

ALTER TABLE `MerchOrders` ADD `CinemaRitiroId` int NULL;

ALTER TABLE `MerchOrders` ADD `Citta` varchar(100) CHARACTER SET utf8mb4 NULL;

ALTER TABLE `MerchOrders` ADD `CostoSpedizione` decimal(10,2) NOT NULL DEFAULT 0.0;

ALTER TABLE `MerchOrders` ADD `CreditoRiservato` decimal(10,2) NOT NULL DEFAULT 0.0;

ALTER TABLE `MerchOrders` ADD `DataConsegnaEffettiva` datetime(6) NULL;

ALTER TABLE `MerchOrders` ADD `DataConsegnaPrevista` datetime(6) NULL;

ALTER TABLE `MerchOrders` ADD `DataSpedizione` datetime(6) NULL;

ALTER TABLE `MerchOrders` ADD `ImportoCarta` decimal(10,2) NOT NULL DEFAULT 0.0;

ALTER TABLE `MerchOrders` ADD `ImportoCredito` decimal(10,2) NOT NULL DEFAULT 0.0;

ALTER TABLE `MerchOrders` ADD `Indirizzo` varchar(200) CHARACTER SET utf8mb4 NULL;

ALTER TABLE `MerchOrders` ADD `LastPaymentError` varchar(500) CHARACTER SET utf8mb4 NULL;

ALTER TABLE `MerchOrders` ADD `PaidAtUtc` datetime(6) NULL;

ALTER TABLE `MerchOrders` ADD `Provincia` varchar(50) CHARACTER SET utf8mb4 NULL;

ALTER TABLE `MerchOrders` ADD `StatoSpedizione` varchar(50) CHARACTER SET utf8mb4 NOT NULL DEFAULT '';

ALTER TABLE `MerchOrders` ADD `StripeCheckoutSessionId` varchar(100) CHARACTER SET utf8mb4 NULL;

ALTER TABLE `MerchOrders` ADD `StripePaymentIntentId` varchar(100) CHARACTER SET utf8mb4 NULL;

ALTER TABLE `MerchOrders` ADD `Telefono` varchar(20) CHARACTER SET utf8mb4 NULL;

ALTER TABLE `MerchOrders` ADD `TipoConsegna` varchar(30) CHARACTER SET utf8mb4 NOT NULL DEFAULT '';

ALTER TABLE `MerchOrders` ADD `TrackingNumber` varchar(30) CHARACTER SET utf8mb4 NULL;

ALTER TABLE `FoodOrderItems` ADD `Servito` tinyint(1) NOT NULL DEFAULT FALSE;

ALTER TABLE `Cinemas` ADD `CAP` varchar(10) CHARACTER SET utf8mb4 NULL;

CREATE TABLE `MerchDiscountCodes` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `Codice` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `PercentualeSconto` decimal(5,2) NOT NULL,
    `Attivo` tinyint(1) NOT NULL,
    `ScadeIl` datetime(6) NULL,
    `MaxUtilizzi` int NOT NULL,
    `Utilizzi` int NOT NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    CONSTRAINT `PK_MerchDiscountCodes` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;

CREATE TABLE `MerchItemImages` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `MerchItemId` int NOT NULL,
    `Path` varchar(500) CHARACTER SET utf8mb4 NOT NULL,
    `Ordine` int NOT NULL,
    CONSTRAINT `PK_MerchItemImages` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_MerchItemImages_MerchItems_MerchItemId` FOREIGN KEY (`MerchItemId`) REFERENCES `MerchItems` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE TABLE `MerchItemVariants` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `MerchItemId` int NOT NULL,
    `Colore` varchar(50) CHARACTER SET utf8mb4 NULL,
    `Taglia` varchar(20) CHARACTER SET utf8mb4 NULL,
    `Stock` int NOT NULL,
    `Prezzo` decimal(10,2) NULL,
    CONSTRAINT `PK_MerchItemVariants` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_MerchItemVariants_MerchItems_MerchItemId` FOREIGN KEY (`MerchItemId`) REFERENCES `MerchItems` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE TABLE `Pacchi` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `MerchOrderId` int NOT NULL,
    `CodicePacco` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
    `CodiceInterno` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
    `QrCodeData` varchar(500) CHARACTER SET utf8mb4 NULL,
    `Stato` varchar(30) CHARACTER SET utf8mb4 NOT NULL,
    `PreparatoreId` int NULL,
    `CorriereId` int NULL,
    `PresoInCaricoIl` datetime(6) NULL,
    `ConsegnatoIl` datetime(6) NULL,
    `TentataConsegnaIl` datetime(6) NULL,
    `NoteCorriere` varchar(300) CHARACTER SET utf8mb4 NULL,
    `Firma` varchar(100) CHARACTER SET utf8mb4 NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    CONSTRAINT `PK_Pacchi` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_Pacchi_MerchOrders_MerchOrderId` FOREIGN KEY (`MerchOrderId`) REFERENCES `MerchOrders` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_Pacchi_Users_CorriereId` FOREIGN KEY (`CorriereId`) REFERENCES `Users` (`Id`),
    CONSTRAINT `FK_Pacchi_Users_PreparatoreId` FOREIGN KEY (`PreparatoreId`) REFERENCES `Users` (`Id`)
) CHARACTER SET=utf8mb4;

CREATE INDEX `IX_MovimentiCredito_MerchOrderId` ON `MovimentiCredito` (`MerchOrderId`);

CREATE INDEX `IX_MerchOrders_CinemaRitiroId` ON `MerchOrders` (`CinemaRitiroId`);

CREATE INDEX `IX_MerchItemImages_MerchItemId` ON `MerchItemImages` (`MerchItemId`);

CREATE INDEX `IX_MerchItemVariants_MerchItemId` ON `MerchItemVariants` (`MerchItemId`);

CREATE INDEX `IX_Pacchi_CorriereId` ON `Pacchi` (`CorriereId`);

CREATE INDEX `IX_Pacchi_MerchOrderId` ON `Pacchi` (`MerchOrderId`);

CREATE INDEX `IX_Pacchi_PreparatoreId` ON `Pacchi` (`PreparatoreId`);

ALTER TABLE `MerchOrders` ADD CONSTRAINT `FK_MerchOrders_Cinemas_CinemaRitiroId` FOREIGN KEY (`CinemaRitiroId`) REFERENCES `Cinemas` (`Id`);

ALTER TABLE `MovimentiCredito` ADD CONSTRAINT `FK_MovimentiCredito_MerchOrders_MerchOrderId` FOREIGN KEY (`MerchOrderId`) REFERENCES `MerchOrders` (`Id`);

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260514142051_AddMerchDiscountCodes', '9.0.11');

CREATE TABLE `AccountActionTokens` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `UserId` int NOT NULL,
    `Purpose` int NOT NULL,
    `TokenHash` varchar(128) CHARACTER SET utf8mb4 NOT NULL,
    `ExpiresAtUtc` datetime(6) NOT NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    `UsedAtUtc` datetime(6) NULL,
    CONSTRAINT `PK_AccountActionTokens` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260514152410_AddAccountActionToken', '9.0.11');

CREATE TABLE `UserCartItems` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `UserId` int NOT NULL,
    `MerchItemId` int NOT NULL,
    `Quantita` int NOT NULL,
    `VariantId` int NULL,
    CONSTRAINT `PK_UserCartItems` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_UserCartItems_MerchItems_MerchItemId` FOREIGN KEY (`MerchItemId`) REFERENCES `MerchItems` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_UserCartItems_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;

CREATE INDEX `IX_UserCartItems_MerchItemId` ON `UserCartItems` (`MerchItemId`);

CREATE INDEX `IX_UserCartItems_UserId` ON `UserCartItems` (`UserId`);

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260514165643_AddUserCartItem', '9.0.11');

ALTER TABLE `Films` ADD `TmdbId` int NULL;

CREATE TABLE `Recensioni` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `FilmId` int NOT NULL,
    `UserId` int NOT NULL,
    `Voto` int NOT NULL,
    `Testo` varchar(2000) CHARACTER SET utf8mb4 NOT NULL,
    `Stato` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
    `CreatedAtUtc` datetime(6) NOT NULL,
    `ApprovataDaUserId` int NULL,
    `ApprovataIl` datetime(6) NULL,
    CONSTRAINT `PK_Recensioni` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_Recensioni_Films_FilmId` FOREIGN KEY (`FilmId`) REFERENCES `Films` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_Recensioni_Users_ApprovataDaUserId` FOREIGN KEY (`ApprovataDaUserId`) REFERENCES `Users` (`Id`) ON DELETE SET NULL,
    CONSTRAINT `FK_Recensioni_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`) ON DELETE RESTRICT
) CHARACTER SET=utf8mb4;

CREATE INDEX `IX_Recensioni_ApprovataDaUserId` ON `Recensioni` (`ApprovataDaUserId`);

CREATE INDEX `IX_Recensioni_FilmId_Stato` ON `Recensioni` (`FilmId`, `Stato`);

CREATE INDEX `IX_Recensioni_Stato` ON `Recensioni` (`Stato`);

CREATE INDEX `IX_Recensioni_UserId` ON `Recensioni` (`UserId`);

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260526084535_AddRecensioniETmdbId', '9.0.11');

ALTER TABLE `PremiRiscatti` ADD `CodiceVoucher` varchar(50) CHARACTER SET utf8mb4 NULL;

ALTER TABLE `PremiRiscatti` ADD `GiftCardId` int NULL;

ALTER TABLE `PremiRiscatti` ADD `MerchOrderId` int NULL;

ALTER TABLE `PremiRiscatti` ADD `Taglia` varchar(20) CHARACTER SET utf8mb4 NULL;

ALTER TABLE `Premi` ADD `MerchItemId` int NULL;

CREATE INDEX `IX_PremiRiscatti_GiftCardId` ON `PremiRiscatti` (`GiftCardId`);

CREATE INDEX `IX_PremiRiscatti_MerchOrderId` ON `PremiRiscatti` (`MerchOrderId`);

CREATE INDEX `IX_Premi_MerchItemId` ON `Premi` (`MerchItemId`);

ALTER TABLE `Premi` ADD CONSTRAINT `FK_Premi_MerchItems_MerchItemId` FOREIGN KEY (`MerchItemId`) REFERENCES `MerchItems` (`Id`);

ALTER TABLE `PremiRiscatti` ADD CONSTRAINT `FK_PremiRiscatti_GiftCards_GiftCardId` FOREIGN KEY (`GiftCardId`) REFERENCES `GiftCards` (`Id`);

ALTER TABLE `PremiRiscatti` ADD CONSTRAINT `FK_PremiRiscatti_MerchOrders_MerchOrderId` FOREIGN KEY (`MerchOrderId`) REFERENCES `MerchOrders` (`Id`);

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260526141734_UpdatePremiConMerchVoucher', '9.0.11');

ALTER TABLE `Premi` ADD `PercentualeSconto` int NULL;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260526181037_AddPercentualeSconto', '9.0.11');

ALTER TABLE `MerchDiscountCodes` ADD `ValoreScontoFisso` decimal(10,2) NOT NULL DEFAULT 0.0;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260526191040_AddValoreScontoFisso', '9.0.11');

ALTER TABLE `Ordini` ADD `VoucherCode` varchar(50) CHARACTER SET utf8mb4 NULL;

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260527073224_AddVoucherCodeToOrdine', '9.0.11');

COMMIT;

