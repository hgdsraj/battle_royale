
package main

import (
	"database/sql"
	"fmt"
)

// Up is executed when this migration is applied
func Up_20180614205644(txn *sql.Tx) {
	_, err := txn.Exec(`
	CREATE TABLE IF NOT EXISTS messages (
		message_content TEXT
		, username TEXT
		, email TEXT
	);`)
	if err != nil {
		fmt.Println(err)
	}
}

// Down is executed when this migration is rolled back
func Down_20180614205644(txn *sql.Tx) {

}
