<<
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"
>>

<<
CREATE TABLE Axi_UserFavourites (
    Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    UserName VARCHAR(255) NOT NULL,
    CommandText TEXT NOT NULL,
    FavOrder INT,
    CreatedOn TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_command UNIQUE (UserName, CommandText)
)
>>