CREATE TABLE Account (
    Account_ID SERIAL PRIMARY KEY,
    FirstName VARCHAR(255) NOT NULL,
    LastName VARCHAR(255) NOT NULL,
    Username VARCHAR(255) NOT NULL UNIQUE,
    Email VARCHAR(255) NOT NULL UNIQUE,
    Phone VARCHAR(15) NOT NULL UNIQUE,
    Account_Role int NOT NULL
);

CREATE TABLE Account_Credential (
    Credential_ID SERIAL PRIMARY KEY,
    Account_ID INT NOT NULL,
    Salted_Hash VARCHAR(255) NOT NULL,
    salt VARCHAR(255),
    FOREIGN KEY (Account_ID) REFERENCES Account (Account_ID)
);

CREATE TABLE Birds (
    Formatted_Com_Name TEXT PRIMARY KEY,
    Com_Name TEXT NOT NULL,
    Sci_Name TEXT,
    Preview_Photo TEXT,
    Male_Breeding_Photo TEXT,
    Male_Nonbreeding_Photo TEXT,
    Female_Photo TEXT,
    Sound TEXT,
    Short_Desc TEXT,
    Long_Desc TEXT,
    How_To_Find TEXT,
    Learn_More_Link TEXT
);

COPY birds FROM '/docker-entrypoint-initdb.d/birds.csv'

DELIMITER ','

CSV HEADER;