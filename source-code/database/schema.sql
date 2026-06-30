-- Horse Racing Tournament Management System Schema
-- For SQL Server (SQLEXPRESS)

IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'HorseRacing')
BEGIN
    CREATE DATABASE HorseRacing;
END
GO

USE HorseRacing;
GO

-- Drop tables if they exist to allow clean recreations
IF OBJECT_ID('Awards', 'U') IS NOT NULL DROP TABLE Awards;
IF OBJECT_ID('Prizes', 'U') IS NOT NULL DROP TABLE Prizes;
IF OBJECT_ID('RaceInspections', 'U') IS NOT NULL DROP TABLE RaceInspections;
IF OBJECT_ID('Predictions', 'U') IS NOT NULL DROP TABLE Predictions;
IF OBJECT_ID('Rankings', 'U') IS NOT NULL DROP TABLE Rankings;
IF OBJECT_ID('Violations', 'U') IS NOT NULL DROP TABLE Violations;
IF OBJECT_ID('Results', 'U') IS NOT NULL DROP TABLE Results;
IF OBJECT_ID('RaceParticipants', 'U') IS NOT NULL DROP TABLE RaceParticipants;
IF OBJECT_ID('Registrations', 'U') IS NOT NULL DROP TABLE Registrations;
IF OBJECT_ID('JockeyInvitations', 'U') IS NOT NULL DROP TABLE JockeyInvitations;
IF OBJECT_ID('Races', 'U') IS NOT NULL DROP TABLE Races;
IF OBJECT_ID('Rounds', 'U') IS NOT NULL DROP TABLE Rounds;
IF OBJECT_ID('Tournaments', 'U') IS NOT NULL DROP TABLE Tournaments;
IF OBJECT_ID('Horses', 'U') IS NOT NULL DROP TABLE Horses;
IF OBJECT_ID('SpectatorProfiles', 'U') IS NOT NULL DROP TABLE SpectatorProfiles;
IF OBJECT_ID('RefereeProfiles', 'U') IS NOT NULL DROP TABLE RefereeProfiles;
IF OBJECT_ID('HorseOwnerProfiles', 'U') IS NOT NULL DROP TABLE HorseOwnerProfiles;
IF OBJECT_ID('JockeyProfiles', 'U') IS NOT NULL DROP TABLE JockeyProfiles;
IF OBJECT_ID('Users', 'U') IS NOT NULL DROP TABLE Users;
IF OBJECT_ID('Roles', 'U') IS NOT NULL DROP TABLE Roles;
GO

-- 1. Roles table
CREATE TABLE Roles (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- 2. Users table
CREATE TABLE Users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NULL,
    avatar VARCHAR(255) NULL,
    role_id INT NOT NULL FOREIGN KEY REFERENCES Roles(id),
    is_active BIT DEFAULT 1
);

-- 3. JockeyProfiles table
CREATE TABLE JockeyProfiles (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL UNIQUE FOREIGN KEY REFERENCES Users(id) ON DELETE CASCADE,
    bio NVARCHAR(MAX),
    weight DECIMAL(5,2),
    height DECIMAL(5,2),
    experience_years INT DEFAULT 0
);

-- 4. HorseOwnerProfiles table
CREATE TABLE HorseOwnerProfiles (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL UNIQUE FOREIGN KEY REFERENCES Users(id) ON DELETE CASCADE,
    company_name NVARCHAR(100) NULL,

    age INT NULL,
    experience_years INT NULL,
    occupation NVARCHAR(255) NULL,
    address NVARCHAR(255) NULL,
    nationality NVARCHAR(100) NULL,
    social_link NVARCHAR(255) NULL,
    bio NVARCHAR(MAX) NULL
);

-- 5. RefereeProfiles table
CREATE TABLE RefereeProfiles (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL UNIQUE FOREIGN KEY REFERENCES Users(id) ON DELETE CASCADE,
    certification_level NVARCHAR(50) NULL
);

-- 6. SpectatorProfiles table
CREATE TABLE SpectatorProfiles (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL UNIQUE FOREIGN KEY REFERENCES Users(id) ON DELETE CASCADE,
    favorite_horse_breed NVARCHAR(50) NULL,
    favorite_jockey NVARCHAR(100) NULL,
    reward_points INT NOT NULL DEFAULT 0
);

-- 7. Horses table
CREATE TABLE Horses (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    age INT NOT NULL,
    breed NVARCHAR(100) NOT NULL,
    gender VARCHAR(10) NOT NULL,
    owner_id INT NOT NULL FOREIGN KEY REFERENCES HorseOwnerProfiles(id) ON DELETE CASCADE
);

-- 8. Tournaments table
CREATE TABLE Tournaments (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(150) NOT NULL,
    description NVARCHAR(MAX),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    location NVARCHAR(150),
    status VARCHAR(50) DEFAULT 'UPCOMING' -- UPCOMING, ACTIVE, COMPLETED
);

-- 9. Rounds table
CREATE TABLE Rounds (
    id INT IDENTITY(1,1) PRIMARY KEY,
    tournament_id INT NOT NULL FOREIGN KEY REFERENCES Tournaments(id) ON DELETE CASCADE,
    name NVARCHAR(100) NOT NULL,
    sequence INT NOT NULL
);

-- 10. Races table
CREATE TABLE Races (
    id INT IDENTITY(1,1) PRIMARY KEY,
    round_id INT NOT NULL FOREIGN KEY REFERENCES Rounds(id) ON DELETE CASCADE,
    name NVARCHAR(100) NOT NULL,
    race_time DATETIME NOT NULL,
    track_condition NVARCHAR(100),
    distance INT NOT NULL, -- in meters
    referee_id INT FOREIGN KEY REFERENCES RefereeProfiles(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'SCHEDULED' -- SCHEDULED, RUNNING, COMPLETED
);

-- 11. Registrations (Horse-Jockey pair registering for a Tournament)
CREATE TABLE Registrations (
    id INT IDENTITY(1,1) PRIMARY KEY,
    tournament_id INT NOT NULL FOREIGN KEY REFERENCES Tournaments(id) ON DELETE CASCADE,
    horse_id INT NOT NULL FOREIGN KEY REFERENCES Horses(id),
    jockey_id INT NOT NULL FOREIGN KEY REFERENCES JockeyProfiles(id),
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    registration_date DATETIME DEFAULT GETDATE(),
    CONSTRAINT UC_Registration UNIQUE (tournament_id, horse_id)
);

-- 12. JockeyInvitations (Owner invites a Jockey to ride a Horse for a Tournament)
CREATE TABLE JockeyInvitations (
    id INT IDENTITY(1,1) PRIMARY KEY,
    owner_id INT NOT NULL FOREIGN KEY REFERENCES HorseOwnerProfiles(id),
    jockey_id INT NOT NULL FOREIGN KEY REFERENCES JockeyProfiles(id),
    horse_id INT NOT NULL FOREIGN KEY REFERENCES Horses(id),
    tournament_id INT NOT NULL FOREIGN KEY REFERENCES Tournaments(id),
    message NVARCHAR(MAX),
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, ACCEPTED, REJECTED
    created_at DATETIME DEFAULT GETDATE()
);

-- 13. RaceParticipants (Matches registered Horse-Jockey pairs to specific Races)
CREATE TABLE RaceParticipants (
    id INT IDENTITY(1,1) PRIMARY KEY,
    race_id INT NOT NULL FOREIGN KEY REFERENCES Races(id) ON DELETE CASCADE,
    registration_id INT NOT NULL FOREIGN KEY REFERENCES Registrations(id),
    lane_number INT NOT NULL,
    start_time DATETIME NULL,
    finish_time DATETIME NULL, -- NULL if did not finish or hasn't run yet
    status VARCHAR(50) DEFAULT 'REGISTERED', -- REGISTERED, FINISHED, DNF, DISQUALIFIED
    CONSTRAINT UC_Lane UNIQUE (race_id, lane_number),
    CONSTRAINT UC_Participant UNIQUE (race_id, registration_id)
);

-- 14. Results table
CREATE TABLE Results (
    id INT IDENTITY(1,1) PRIMARY KEY,
    race_participant_id INT NOT NULL UNIQUE FOREIGN KEY REFERENCES RaceParticipants(id) ON DELETE CASCADE,
    rank INT NOT NULL,
    points INT NOT NULL DEFAULT 0,
    notes NVARCHAR(MAX)
);

-- 15. Violations table
CREATE TABLE Violations (
    id INT IDENTITY(1,1) PRIMARY KEY,
    race_participant_id INT NOT NULL FOREIGN KEY REFERENCES RaceParticipants(id) ON DELETE CASCADE,
    description NVARCHAR(MAX) NOT NULL,
    penalty NVARCHAR(100),
    fine_amount DECIMAL(10,2) DEFAULT 0.00,
    violation_date DATETIME DEFAULT GETDATE()
);

-- 15.5. RaceInspections table
CREATE TABLE RaceInspections (
    id INT IDENTITY(1,1) PRIMARY KEY,
    race_id INT NOT NULL UNIQUE FOREIGN KEY REFERENCES Races(id) ON DELETE CASCADE,
    weather NVARCHAR(255) NULL,
    track_condition NVARCHAR(255) NULL,
    horse_health NVARCHAR(MAX) NULL,
    created_at DATETIME DEFAULT GETDATE()
);

-- 16. Rankings table
CREATE TABLE Rankings (
    id INT IDENTITY(1,1) PRIMARY KEY,
    entity_type VARCHAR(20) NOT NULL, -- 'HORSE' or 'JOCKEY'
    entity_id INT NOT NULL,
    points INT NOT NULL DEFAULT 0,
    rank INT NOT NULL,
    updated_at DATETIME DEFAULT GETDATE()
);

-- 17. Predictions table
CREATE TABLE Predictions (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL FOREIGN KEY REFERENCES Users(id) ON DELETE CASCADE,
    race_participant_id INT NOT NULL FOREIGN KEY REFERENCES RaceParticipants(id),
    predicted_rank INT NOT NULL,
    prediction_date DATETIME DEFAULT GETDATE(),
    status VARCHAR(50) DEFAULT 'PENDING' -- PENDING, CORRECT, INCORRECT
);
GO

-- 18. Prizes table (Giải thưởng của tournament)
CREATE TABLE Prizes (
    id INT IDENTITY(1,1) PRIMARY KEY,
    tournament_id INT NOT NULL FOREIGN KEY REFERENCES Tournaments(id) ON DELETE CASCADE,
    position INT NOT NULL,               -- Hạng được trao giải (1 = nhất, 2 = nhì, ...)
    title NVARCHAR(100) NOT NULL,         -- Tên giải: "Giải Nhất", "Giải Nhì", ...
    prize_value DECIMAL(15,2) DEFAULT 0.00, -- Giá trị giải thưởng (tiền/hiện vật)
    description NVARCHAR(MAX) NULL,       -- Mô tả thêm về giải thưởng
    created_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT UC_Prize_Position UNIQUE (tournament_id, position)
);

-- 19. Awards table (Bản ghi trao giải – tự động tạo khi Tournament COMPLETED)
CREATE TABLE Awards (
    id INT IDENTITY(1,1) PRIMARY KEY,
    prize_id INT NOT NULL FOREIGN KEY REFERENCES Prizes(id) ON DELETE CASCADE,
    registration_id INT NOT NULL FOREIGN KEY REFERENCES Registrations(id),
    awarded_at DATETIME DEFAULT GETDATE(),
    total_points INT NOT NULL DEFAULT 0,  -- Tổng điểm tích lũy trong tournament
    notes NVARCHAR(MAX) NULL
);
GO

-- Create Indexes for performance optimization
CREATE INDEX IX_Users_Role ON Users(role_id);
CREATE INDEX IX_Horses_Owner ON Horses(owner_id);
CREATE INDEX IX_Rounds_Tournament ON Rounds(tournament_id);
CREATE INDEX IX_Races_Round ON Races(round_id);
CREATE INDEX IX_Registrations_Tournament ON Registrations(tournament_id);
CREATE INDEX IX_RaceParticipants_Race ON RaceParticipants(race_id);
CREATE INDEX IX_Rankings_Entity ON Rankings(entity_type, entity_id);
CREATE INDEX IX_Prizes_Tournament ON Prizes(tournament_id);
CREATE INDEX IX_Awards_Prize ON Awards(prize_id);
CREATE INDEX IX_Awards_Registration ON Awards(registration_id);
GO
