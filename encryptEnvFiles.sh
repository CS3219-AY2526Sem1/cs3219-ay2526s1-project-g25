gpg --batch --yes --passphrase-file .gpg.passphrase -c collaboration-service/collaboration-service/.env
gpg --batch --yes --passphrase-file .gpg.passphrase -c matching-service/matching-service/.env
gpg --batch --yes --passphrase-file .gpg.passphrase -c user-service/user-service/.env
gpg --batch --yes --passphrase-file .gpg.passphrase -c question-service/question-service/.env
gpg --batch --yes --passphrase-file .gpg.passphrase -c feature-login-signup-ui/frontend/.env
gpg --batch --yes --passphrase-file .gpg.passphrase -c feature-matching-ui/frontend/.env
