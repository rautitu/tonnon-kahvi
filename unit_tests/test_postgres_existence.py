import os
import psycopg2

def wait_for_postgres(max_retries=10, delay=2):
    for i in range(max_retries):
        try:
            conn = psycopg2.connect(
                host="db",
                dbname="coffee_prices",
                user="coffee",
                password="coffee123"
            )
            conn.close()
            print("✅ Connected to PostgreSQL!")
            return
        except psycopg2.OperationalError as e:
            print(f"❌ Attempt {i + 1}: PostgreSQL not ready yet... Retrying in {delay}s")
            time.sleep(delay)
    raise Exception("❌ PostgreSQL connection failed after retries.")

def main():
    #step 0: see and wait for postgres to respond
    wait_for_postgres()
    # Step 1: Connect
    conn = psycopg2.connect(
        host=os.environ['DB_HOST'],
        database=os.environ['DB_NAME'],
        user=os.environ['DB_USER'],
        password=os.environ['DB_PASSWORD']
    )
    cur = conn.cursor()

    try:
        # Step 2: Create table
        cur.execute("CREATE TABLE IF NOT EXISTS test_table (id SERIAL PRIMARY KEY, name TEXT);")
        conn.commit()
        print("Table created.")

        # Step 3: Insert row
        cur.execute("INSERT INTO test_table (name) VALUES (%s) RETURNING id;", ("Coffee Bean",))
        inserted_id = cur.fetchone()[0]
        conn.commit()
        print(f"Inserted row with ID: {inserted_id}")

        # Step 4: Select and print
        cur.execute("SELECT id, name FROM test_table;")
        rows = cur.fetchall()
        for row in rows:
            print(f"Row: ID={row[0]}, Name={row[1]}")

    finally:
        # Step 5: Drop table
        cur.execute("DROP TABLE IF EXISTS test_table;")
        conn.commit()
        print("Table dropped.")

        cur.close()
        conn.close()

if __name__ == "__main__":
    main()
