const { select } = require("async");
class BDB{
    consturctor(){
    }
    init(){
        const mysql = require("mysql2/promise");
        this.pool = mysql.createPool({
            host: "localhost",
            port: 3306,
            user: "zemeet",
            password: "zemeet3913",
            database: "zemeet",
            connectionLimit: 50,
          });
    }
    async queryselect( query ) 
    {
        console.log("QUERY:",query)
        const conn = await this.pool.getConnection();
        let result=null;
        try{
            const data = await this.pool.query(query);            
            result = data[0];
            await conn.commit();
        } catch (err) {
            console.log("err:",err);
            conn.rollback();
        } finally {
            conn.release();
        }
        //console.log(result);
        return result;
    }
    async queryexec(query) 
    {
        console.log("QUERY:",query)
        const conn = await this.pool.getConnection()
        try{
            await this.pool.query(query)
            await conn.commit()
        } catch (err) {
            console.log("err:",err)
            conn.rollback()
        } finally {
            conn.release()
        }
    }
    
}


module.exports = new BDB()