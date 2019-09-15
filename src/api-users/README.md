## api-crud : Poliglot API solution
```
API solution that handles SQL requests
```
![Arquitectura](https://user-images.githubusercontent.com/24611413/64218588-433a0880-ce90-11e9-85c1-230cc39b27cd.jpg)
---
## Installing

1. Download the code
3. To install **MySQL** database:
*  Download the **users-dump.sql** dump file from database/users.sql
*  Run the following command:
```
mysql -u <user> -p < users.sql
```
5. Run the following command:
```
    npm install
```
6. Run the following commnad to start the node server (default port 9000):
```
    node server.js
```
---
## Available APIs

**MySQL**
* GET     /api/users/list
* GET     /api/users/find?nickname={nickname}&nombre={nombre}
* GET     /api/users/detail?id={id}
* POST    /api/users/add
* DELETE  /api/users/del/{id}
* PUT     /api/users/update/kudos/{id}
---
## Author

* **Marcelo Claure** - *Initial work*
