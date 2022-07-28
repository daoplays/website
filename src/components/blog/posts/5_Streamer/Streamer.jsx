import React from "react";
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { ChakraProvider, theme, Code, Box, Center } from '@chakra-ui/react';
import {Image} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { solid } from '@fortawesome/fontawesome-svg-core/import.macro' // <-- import styles to be used

import quicknode_img from "./quicknode_useage.png"

const check_json =
`def check_json_result(id, json_result):

    if ("result" in json_result.keys()):
        return True

    if ("error" in json_result.keys()):
        error = json_result["error"]
        print(id, " returned error: ", error)
    
    return False`

   


const get_slot =
`# returns the current slot
def get_slot(dev_client):
    while True:
        try:
            slot = dev_client.get_slot()
        except:
            print("get_slot transaction request timed out")
            time.sleep(sleep_time)
            continue

        if (not check_json_result("get_slot", slot)):
            time.sleep(sleep_time)
            continue

        break
		
    return slot["result"]`

const get_blocks = 
`# returns the list of finalized blocks after and including block_idx
def get_block_list(dev_client, current_block):
    while True:
        try:
            block_list = dev_client.get_blocks(current_block)
        except:
            print("block_list transaction request timed out")
            time.sleep(sleep_time)
            continue

        if (not check_json_result("get_blocks", block_list)):
            time.sleep(sleep_time)
            continue

        if (len(block_list["result"]) == 0):
            time.sleep(sleep_time)
            continue          

        break

    return block_list["result"]`

const streamer_get_block =
`# in streamer.py
...

    # request all the blocks in block_list from the endpoint
    blocks = get_blocks(quick_node_dev, block_list)

...`

const process_block_1 =
`# get the block and process it
def get_data_from_block(block_idx, block):

    data_vec = []
    program = "H73oSXtdJfuBz8JWwdqyG92D3txMqxPEhAhT23T8eHf5"

    for t in block["transactions"]:
        transaction_message = t["transaction"]["message"]
        accounts = transaction_message["accountKeys"]
        instructions = transaction_message["instructions"]

        for instruction in instructions:

            program_index = instruction["programIdIndex"]

            if (program_index >= len(accounts)):
                continue

            if (accounts[program_index] != program):
                continue
...
`

const process_block_2 =
`...        
        if ("data" not in instruction.keys()):
            continue

        data = instruction["data"]
        decoded_data = base58.b58decode(data)
...`

const process_block_3 =
`...        
        try:
            args = message.parse(decoded_data)
        except:
            print("unable to parse data", decoded_data)
            continue

        if(not isinstance(args, message.enum.MakeChoice)):
            print("Have data but not a MakeChoice:", args)
            continue

        data_vec.append(args)

    return block_idx, data_vec`

const program_state =
`// in instruction.rs
pub enum ChoiceInstruction {

    MakeChoice {
        choice_data: ChoiceData
    }
}`

const choice_data =
`// in state.rs
pub enum Choice {
    A,
    B,
    C,
    D
}

pub struct ChoiceData {
    pub choice : Choice,
    pub bid_amount : u64
}`

const python_state =
`# the enum listing available choices
choice_type = Enum(
	"A",
	"B",
	"C",
	"D",
    enum_name = "Choice"
)

# the structure that MakeChoice expects containing a choice and a bid amount
ChoiceData = CStruct(
    "choice" / choice_type,
    "bid_amount" / U64
)

# enum of instructions the program can be sent
message = Enum(
	"MakeChoice" / CStruct("choice_data" / ChoiceData),
	enum_name="ChoiceInstruction"
)`

const streamer_connect_1 =
`# in streamer.py

db_conn = create_database_connection()
# check the connection is valid
if db_conn is None:
	print("Error! cannot create the database connection.")
	exit()
...`

const streamer_connect_2 =
`# in streamer.py

# connect to solana endpoint
quick_node_dev = "MY_QUICK_NODE"

dev_client = Client(quick_node_dev)

if (not dev_client.is_connected()):
    print("Error! cannot connect to quicknode endpoint.")
    exit()
...`

const streamer_state_1 =
`# in streamer.py
...

current_row_id_to_insert = None
current_block = None

last_db_row = get_last_db_row(db_conn)

...`

const streamer_state_2 =
`# in streamer.py
...

if (last_db_row != None):
    print("getting current_block from DB: ")
    print(last_db_row)

    current_row_id_to_insert = last_db_row[0] + 1
    current_block = last_db_row[1]

...`

const streamer_state_3 =
`# in streamer.py
...

else:
    print("getting current_block from client")
    current_row_id_to_insert = 0
    current_block = get_slot(dev_client)

print("Starting with row: ", current_row_id_to_insert, " Current block: ", current_block)

...`

const streamer_3 =
`...
while(True):

    # get all the blocks after and including current_block
    block_list = get_block_list(dev_client, current_block)

    # if the last block in the list was the current block, just wait and check again shortly
    if(block_list[-1] == current_block):
        time.sleep(0.05)
        continue

    # we are only interested in the blocks after current_block so remove that one from the list
    block_list = block_list[1:]

 ...`

const create_rows_from_data =
`# in rpc_funcs.py
# create the rows for the database from the block data
def create_rows_from_data(row_id_to_insert, block_id, data, rows_vec):

    if(len(data) == 0):
        new_row = (row_id_to_insert, block_id, "no_choice", 0)
        print("adding row: ", new_row)
        rows_vec.append(new_row)
        row_id_to_insert += 1
    else:
        for i in range(len(data)):
            args = data[i]
            row_id = row_id_to_insert + i
            new_row = (row_id, block_id, str(args.choice_data.choice), args.bid_amount)
            print("adding row: ", new_row)
            rows_vec.append(new_row)
			
        row_id_to_insert += len(data)
			
    return row_id_to_insert`


const streamer_4 =
`...
        rows_to_insert = []
        # if there is only one block in the list we don't need to do any multithreading, just get the transactions and process them
        if(len(block_list) == 1):
        
            b_idx, data = get_data_from_block(block_list[0], blocks[block_list[0]])
    
            current_row_id_to_insert = create_rows_from_data(current_row_id_to_insert, b_idx, data, rows_to_insert)
        
        else:
        
            # if we have more than one block then multithread the requests and store them in a map with the block number as the key
            block_data = {}
            with cf.ThreadPoolExecutor(len(block_list)) as executor:
                futures = [executor.submit(get_data_from_block, block_id, blocks[block_id]) for block_id in block_list]
                
                for future in cf.as_completed(futures):
                    # get the result for the next completed task
                    b_result = future.result() # blocks
                    block_data[b_result[0]] = b_result
            
            # once we have all the blocks process them in sequence so that they get stored in the database in sequential order
            for block_idx in block_list:
    
                b_idx, data = block_data[block_idx]
    
                current_row_id_to_insert = create_rows_from_data(current_row_id_to_insert, b_idx, data, rows_to_insert)
            
        insert_rows(db_conn, rows_to_insert)
    
        #  update current_block to the last one in our list
        current_block = block_list[-1]`

const create_db =
`# in sql_funcs.py
# setup the connection to the database and create the table if required
def create_database_connection():
	""" create a database connection to the SQLite database
	specified by db_file
	:param db_file: database file
	:return: Connection object or None
	"""
	
	db_file = r"solana_block_data.db"
	conn = None
	try:
		conn = sqlite3.connect(db_file, isolation_level=None)
		
	except Error as e:
		print(e)
		return conn
		
    success = create_table(conn)

    if (not success):
        return None

    return conn`

const create_table =
`# in sql_funcs.py
# will create a table with the structure defined in the create table instruction if
# it does not already exist
def create_table(conn):
    """ create a table from the create_table_sql statement
    :param conn: Connection object
    :return:
    """

    create_table_idx = """ CREATE TABLE IF NOT EXISTS block_data (
        id int PRIMARY_KEY,
        block_slot int NOT NULL,
        choice string NOT NULL,
        bid_amount int NOT NULL); """
        
    try:
        c = conn.cursor()
        c.execute(create_table_idx)
    except Error as e:
        print(e)
        return False

    return True`

const insert_rows =
`# inset a set of rows into the table within a single transaction
def insert_rows(conn, rows):
	"""
	Create a new entry in the block_data table
	:param conn:
	:param row:
	:return: project id
	"""
	sql = ''' INSERT INTO block_data(id,block_slot,choice,bid_amount)
	      VALUES(?,?,?,?) '''
	cur = conn.cursor()
	cur.execute("begin")
	for row in rows:
		cur.execute(sql, row)
	cur.execute("commit")`

const get_next_row =
`# in sql_funcs.py

# returns the last row in the database, or None if it is empty
def get_last_db_row(conn):

    # get the row that has the maximum value of id
    # this returns a vector that has the shape [row, max_id]
    # so we only return the first N_COLS=4 values

    cur = conn.cursor()
    cur.execute("SELECT *, max(id) FROM signatures")
    r = cur.fetchone()

    if (r[0] == None):
        return None

    return r[:N_COLS]`

const make_blocks_batch_request_0 =
`# in rpc_funcs.py
    
def make_blocks_batch_request(dev_client_url, block_list, have_block, blocks):
    
...`

const make_blocks_batch_request_1 =

`...

    headers = CaseInsensitiveDict()
    headers["Content-Type"] = "application/json"

    request_vec = []
    for i in range(len(block_list)):

        if (have_block[i]):
            continue

        new_request = json.loads('{
            "jsonrpc": "2.0",
            "id": 0, 
            "method":"getBlock", 
            "params":[0, 
                {
                    "encoding": "json", 
                    "transactionDetails":"full", 
                    "rewards": false, 
                    "maxSupportedTransactionVersion":0
                }
            ]
        }')

        new_request["id"] = i + 1
        new_request["params"][0] = block_list[i]
        request_vec.append(new_request)`

const make_blocks_batch_request_2 =

`...
    
    while True:
        try:
            resp = requests.post(dev_client_url, headers=headers, data=json.dumps(request_vec))
        except:
            print("getBlock batch request timed out")
            time.sleep(sleep_time)
            continue

        break

    if (resp.status_code != 200):
        return have_block, blocks

    resp_json = resp.json()   
        
...`

const make_blocks_batch_request_3 =

`...

    for response in resp_json:
        if ("id" not in response.keys()):
            continue

        if ("result" not in response.keys()):
            continue

        id = response["id"]
        blocks[block_list[id - 1]] = response["result"]
        have_block[id - 1] = True

    return have_block, blocks`

const get_one_block_batch =

`#in rpc_funcs.py
def get_one_block_batch(dev_client_url, batch_block_list):
	
	batch_blocks = {}
	have_block = np.array([False] * len(batch_block_list))
	while (len(np.array(batch_block_list)[have_block == False]) != 0):
		print("requesting", len(batch_block_list), "blocks:", batch_block_list)
		have_block, batch_blocks = make_blocks_batch_request(dev_client_url, batch_block_list, have_block, batch_blocks)
		print(have_block)
			
	return batch_blocks`  
    
const get_blocks_from_list =

`#in rpc_funcs.py  
# Returns identity and transaction information about a confirmed block in the ledger
def get_blocks(dev_client_url, block_list):
    
    n_blocks = len(block_list)
    batch_size = 100
    # only submit max 100 requests in one go.  At some point this will start to timeout if too many are sent
    n_batches = n_blocks//batch_size + 1
    blocks = {}
    
    if (n_batches == 1):
        blocks = get_one_block_batch(dev_client_url, block_list)
    
...`

const get_blocks_from_list_2 =

`...

    else:
        print("requesting ", n_batches, " with total ", n_blocks, " blocks")
        
        batch_lists = []
        for batch in range(n_batches):
            batch_start = batch * batch_size
            batch_end = min(n_blocks, batch_start + batch_size)
            batch_block_list = block_list[batch_start : batch_end]
            batch_lists.append(batch_block_list)
            
...`

const get_blocks_from_list_3 =

`...

        max_threads = 10
        with cf.ThreadPoolExecutor(max_threads) as executor:
            futures = [executor.submit(get_one_block_batch, dev_client_url, batch_lists[batch_id]) for batch_id in range(n_batches)]
            
            for future in cf.as_completed(futures):
                # get the result for the next completed task
                batch_blocks = future.result() # blocks
                for block in batch_blocks.keys():
                    blocks[block] = batch_blocks[block]
        
    return blocks`


function PostContent() {


    return (

        <div className="container">
            <main>

            <h1 className="h1 text-center mb-0 pt-3 font-weight-bold text-body">Monitoring the Solana BlockChain in Real Time</h1>
            <h1 className="h5 text-center mb-1 pt-0 font-weight-bold text-secondary">July 27 2022</h1>
            <br />

            <h2 id="intro-header" className="mt-5" style={{fontSize: "22px"}}>Introduction</h2><br />

            
            
            One of the advantages of the Solana blockchain over other technologies is the speed with which new blocks can be produced.  On the <a style={{textDecoration: "underline"}} href="https://explorer.solana.com/">mainnet</a> blockchain this happens roughly every 0.7 seconds, and on the  <a style={{textDecoration: "underline"}} href="https://explorer.solana.com/?cluster=devnet">devnet</a> blockchain it is even faster, with a new block being produced every 0.4 seconds. The app that we are currently developing takes advantage of this by using the block production rate to set it's 'heartbeat'.  Every time a new block is produced the state of the off-chain component of the app updates, and users can decide how the state will update by interacting with an on-chain program.   Even if no-one uses the program within a given block however, the state of the off-chain program will still update (imagine any video game where even if you aren't pressing buttons, time is still passing in the game world).  
            
            <br/><br/>
            
            We therefore need to be able to monitor every block that is validated, check whether any transactions within that block interacted with our on-chain program, and then save the result in a database.  The off-chain app can then use this database to update its state in real time as each new block is produced.

            <br/><br/>

            One key requirement of our monitoring system is that when running live, and producing the database in realtime, it should yield exactly the same result as someone who simply downloads the data from the blockchain months or years later and builds their own database when all the blocks are available historically.  Both the on and off-chain apps will be available for anyone to run themselves, and are being designed so that anyone using the same starting block should be able to retrieve the history of the chain from that point, and arrive at the same current state in order to verify that everything is working as advertised.  We therefore have to ensure that the events in the live database will never be out of order due to the asynchronous nature of requesting information from the blockchain.

            <br/><br/>

            In this post we will describe the approach we have taken, the code for which is available in the python directory of our GitHub repo for this post <a style={{textDecoration: "underline"}} href="https://github.com/daoplays/solana_examples/tree/master/solana_streamer">here</a>.  There is also a rust implementation of a program that we are running on the Solana devnet, and an example client that will allow you to test the monitor code yourself, which we will describe at the <a style={{textDecoration: "underline"}} href="#test-header">bottom</a> of this post.  
            
            <br/><br/>
            
            The flow of the monitoring program is as follows:

            <br/><br/>
            <ul>
                <li>Establish connections to our SQL database and Solana RPC endpoint <a href="#connect-header"><FontAwesomeIcon icon={solid('arrow-right')}  /></a></li>
                <li>Determine the correct starting state <a href="#state-header"><FontAwesomeIcon icon={solid('arrow-right')}  /></a></li>
                <li>Request the set of finalized blocks from the last known entry up to the most recently validated block <a  href="#block-number-header"><FontAwesomeIcon icon={solid('arrow-right')}  /></a></li>
                <li>Parse the data in those blocks and add new entries to the database <a href="#get-data-header"><FontAwesomeIcon icon={solid('arrow-right')}  /></a></li>
                <li>Repeat the last two steps indefinitely</li>
            </ul>

            <br/>

            We will now go through each of these tasks in detail.
  
            <br/>

            <h3 id="connect-header" className="mt-5" style={{fontSize: "20px"}}>Getting Connected</h3><br />

            The main loop for our monitoring system is found in <Code><a style={{textDecoration: "underline"}} href="https://github.com/daoplays/solana_examples/blob/master/solana_streamer/python/streamer.py">streamer.py</a></Code>,  which starts by establishing a connection to the SQL database:

            <br /><br />
            <SyntaxHighlighter language="python" style={docco}>
            {streamer_connect_1}
            </SyntaxHighlighter>


            <br/><br/>

            The <Code>create_database_connection</Code> function is shown in full below:
            
            <br /><br />
            <SyntaxHighlighter language="python" style={docco}>
            {create_db}
            </SyntaxHighlighter>
            <br/>

            Here we are making use of the python <Code><a style={{textDecoration: "underline"}} href="https://docs.python.org/3/library/sqlite3.html">sqlite3</a></Code> module to manage our database, which we have called <Code>solana_block_data.db</Code>, and use the <Code><a style={{textDecoration: "underline"}} href="https://docs.python.org/3/library/sqlite3.html#sqlite3.connect">connect</a></Code> function to open the connection.  Note that we are setting the <Code><a style={{textDecoration: "underline"}} href="https://docs.python.org/3/library/sqlite3.html#sqlite3.Connection.isolation_level">isolation_level</a></Code> to <Code>None</Code> here, which means that we will be explicitly controlling the start and end of the transactions that will be adding rows into our database, rather than have the python module handle this in the background for us.  If for some reason this fails the function will return <Code>None</Code> and the main code in <Code>streamer.py</Code> will immediately exit with an error.  If it succeeds it will call the <Code>create_table</Code> function shown below:

            <br /><br />
            <SyntaxHighlighter language="python" style={docco}>
            {create_table}
            </SyntaxHighlighter>
            <br/>

            The inclusion of the <Code>IF_NOT_EXISTS</Code> statement in <Code>create_table_idx</Code> ensures that this instruction will only actually do anything if the table doesn't already exist in the database.  In this case it will create a table with four columns, an <Code>id</Code> which is simply the row index and provides a unique identifier for each row, <Code>block_slot</Code> which is the slot number for a particular block, and finally <Code>choice</Code> and <Code>bid_amount</Code> which are the quantities that users can pass to our program that we want to keep track of, and will determine the evolution of our off-chain application.  If for some reason this process fails it will return <Code>False</Code> and the main program will exit immediately with an error.

            <br/><br/>

            Assuming this connection has been established correctly, we then also connect to our <a style={{textDecoration: "underline"}} href="https://www.quicknode.com/">QuickNode</a> endpoint so that we can start making RPC requests.  
            
            <br /><br />
            <SyntaxHighlighter language="python" style={docco}>
            {streamer_connect_2}
            </SyntaxHighlighter>
            <br/>
            
            As we will show later, this monitoring process uses a lot of requests, so we don't recommend trying to use the public endpoints as you will find yourself kicked off very quickly!

            <h3 id="state-header" className="mt-5" style={{fontSize: "20px"}}>Determining The Current State</h3><br />


            The next step is to initialize the current state of the monitoring server, which will happen differently when we are starting fresh and the database is  empty, compared to when we are restarting the monitoring server and the database already exists.
            
            <br/><br/>

            To find out which state we are in we use the function <Code>get_last_db_row</Code>:

            <br /><br />
            <SyntaxHighlighter language="python" style={docco}>
            {streamer_state_1}
            </SyntaxHighlighter>
            <br />

            This function, shown below, creates an SQL query that will return the row that has the maximum value of <Code>id</Code> in the database.  If there are no entries it will return <Code>None</Code>, and otherwise it will return the row.  Note this is a very slow function to call, and this is the only time that we make use of it.  Typically we will be tracking the current row id using the <Code>current_row_id_to_insert</Code> variable in <Code>streamer.py</Code>, and incrementing it as we  iterate through the main loop.

            <br /><br />
            <SyntaxHighlighter language="python" style={docco}>
            {get_next_row}
            </SyntaxHighlighter>
            <br />

            If there were already entries present then we can simply use the row id and block number from that row as the starting point for the main loop:  
            <br /><br />
            <SyntaxHighlighter language="python" style={docco}>
            {streamer_state_2}
            </SyntaxHighlighter>
            <br />

            If the database doesn't currently exist, and <Code>get_last_db_row</Code> returned <Code>None</Code>, then we will set the current row id to zero, and use the <Code>get_slot</Code> function to retrieve the current slot number being worked on.   Just a quick note here about blocks and slots; every block that is confirmed on the Solana blockchain has a corresponding slot, and in these cases the slot number and block number tend to be used interchangeably.  Not all slots, however, have a block (we will come back to this later), and when using <Code>get_slot</Code> you can pass a <Code>commitment</Code> argument to specify how certain you want to be that the slot returned will actually have a block associated with it.  By default this commitment level is set to <Code>finalized</Code>, which means the slot will definitely have a block.

            <br /><br />
            <SyntaxHighlighter language="python" style={docco}>
            {streamer_state_3}
            </SyntaxHighlighter>
            <br />

            The <Code><a style={{textDecoration: "underline"}} href="https://docs.solana.com/developing/clients/jsonrpc-api#getslot">get_slot</a></Code> function is the first example in this post of a call to the Solana JSON RPC <a style={{textDecoration: "underline"}} href="https://docs.solana.com/developing/clients/jsonrpc-api">API</a>. Two of the three requests follow this same format (the other being <Code>get_blocks</Code> which we will use in the next section).  As the request to the API is asynchronous, there is no guarantee that it will return successfully, as it may time out or some other problem may occur while processing the request.  We therefore set up a <Code>While</Code> loop that tries to get a response, and catches any errors in order to simply try again after a short wait (0.25 seconds in our example).           

            <br /><br />
            <SyntaxHighlighter language="python" style={docco}>
            {get_slot}
            </SyntaxHighlighter>
            <br /> 

            The responses from these requests should include either a <Code>result</Code> node, or an <Code>error</Code> node indicating something has gone wrong with the request.  Sometimes however, a problem may occur when sending or receiving the request which causes neither of these to be present.  We therefore define a simple helper function <Code>check_json</Code> to return   <Code>True</Code> if the result node is present, and otherwise return <Code>False</Code>, logging the error if it was present:

            <br /><br />
            <SyntaxHighlighter language="python" style={docco}>
            {check_json}
            </SyntaxHighlighter>
            <br /> 

            At this point we now have everything we need to initialize the current state of our monitor, and can enter the main loop that will take care of actually requesting the block data needed for our database.


            <h3 id="monitor-header" className="mt-5" style={{fontSize: "20px"}}>The Monitoring Loop</h3><br />

            We now enter the main loop, which consists of three main steps:
            <br/><br/>
            
            <ul>
                <li>request the set of finalized block numbers since the last iteration <a href="#block-number-header"><FontAwesomeIcon icon={solid('arrow-right')}  /></a></li>
                <li>request the data for those blocks <a href="#get-blocks-header"><FontAwesomeIcon icon={solid('arrow-right')}  /></a></li>
                <li>process that data and store it in our database <a href="#get-data-header"><FontAwesomeIcon icon={solid('arrow-right')}  /></a></li>
            </ul>
            <br/>

            We will go through each of these in turn below.


            <h4 id="block-number-header" className="mt-5" style={{fontSize: "18px"}}>Getting The Next Finalized Block Numbers</h4><br />

            Unlike other blockchains like Ethereum, some blocks on the Solana blockchain can be '<a style={{textDecoration: "underline"}} href="https://support.quicknode.com/hc/en-us/articles/5793700679441-Why-are-slots-blocks-missing-on-Solana-">skipped</a>', meaning they will contain no data. When trying to get the set of blocks that we should request, we just want to be able to ignore these skipped blocks, and the RPC API provides the function <Code><a style={{textDecoration: "underline"}} href=" https://docs.solana.com/developing/clients/jsonrpc-api#getblocks">get_blocks</a></Code> to do precisely that.  We just pass as an argument the most recent valid block number that we know about, and it will return the list of finalized blocks from that number, up to the most recent.
            
            
            <br/><br/>
            As with <Code>get_slot</Code>, we wrap the <Code>get_blocks</Code> function in a <Code>While</Code> loop within our <Code>get_block_list</Code> function, shown below.   We also use our <Code>check_json</Code> function again here to verify whether the response is as expected, and in this case we also check that the list of blocks is not empty.  


            <br /><br />
            <SyntaxHighlighter language="python" style={docco}>
            {get_blocks}
            </SyntaxHighlighter>
            <br /> 

            Within the main loop of our monitor, we check if the last entry of the list returned by <Code>get_block_list</Code> is the same as <Code>current_block</Code>.  If it is then we know that no new blocks have been finalized, and so we simply wait a short time and then check again.  Once we have new blocks within the list we simply remove the first entry and proceed to the next step.


            <br /><br />
            <SyntaxHighlighter language="python" style={docco}>
            {streamer_3}
            </SyntaxHighlighter>


            <h4 id="get-blocks-header" className="mt-5" style={{fontSize: "18px"}}>Getting the Blocks</h4><br />

            Unlike the previous two RPC requests, in this case we want to be able to make multiple requests to the <Code><a style={{textDecoration: "underline"}} href=" https://docs.solana.com/developing/clients/jsonrpc-api#getblock">get_block</a></Code> RPC function.  As such  we will create a batch request and use the python <Code>requests</Code> module to post that to our endpoint.  We handle creating the batch requests in the <Code>make_blocks_batch_request</Code> function in <Code><a style={{textDecoration: "underline"}} href="https://github.com/daoplays/solana_examples/blob/master/solana_streamer/python/rpc_funcs.py">rpc_funcs.py</a></Code>.  

            <br /><br />
            <SyntaxHighlighter language="python" style={docco}>
            {make_blocks_batch_request_0}
            </SyntaxHighlighter>

            <br/>

            Here <Code>dev_client_url</Code> is the URL of our RPC endpoint and <Code>block_list</Code> is the list of slots that we recieved from <Code>get_slot</Code> previously.  In order to track the success of each request within the batch we use <Code>have_block</Code>, which is vector of bools that has the same length as <Code>block_list</Code>, and finally <Code>blocks</Code> is a map that will contain the responses for each block within the batch.

            <br/><br/>

            The format for these requests can be found <a style={{textDecoration: "underline"}} href="https://docs.solana.com/developing/clients/jsonrpc-api#request-formatting">here</a>, and requires us to create a json with the correct headers and formatting.  When submitting a batch request we require a single header, and the individual requests are simply appended together into a vector, with each one getting it's own unique id  within the batch.

            <br /><br />
            <SyntaxHighlighter language="python" style={docco}>
            {make_blocks_batch_request_1}
            </SyntaxHighlighter>

            <br/>

            The header contains only a single entry for the node <Code>Content-Type</Code>, which must be set to <Code>application/json</Code>.  We define a template request using <Code>new_request</Code>, which we just assign a default id and slot of zero.  Most of the settings in the params node are straight forward, though the <Code>maxSupportedTransactionVersion</Code> setting is a relatively new addition and is required to support blocks that have transactions using the <a style={{textDecoration: "underline"}} href="https://docs.rs/solana-program/latest/solana_program/message/index.html">v0</a> message type, as opposed to only "legacy", which is still the default.

            <br/><br/>

            For each block in the list we use this template to create a new request to <Code>getBlock</Code>, set the slot appropriately, and increment the id number, before adding it to the <Code>request_vec</Code> vector.

           
            <br /><br />
            <SyntaxHighlighter language="python" style={docco}>
            {make_blocks_batch_request_2}
            </SyntaxHighlighter>        
            <br />

            With the batch request constructed we can then post it to our endpoint using the <Code>requests</Code> module.  As with the standard RPC API requests, we still need to manage the times where the request times out, or some other error occurs.  As before we therefore wrap the post method in a <Code>while</Code> loop that retries until a response has been received.  If the request has returned successfully it will have a <Code>status_code</Code> of 200, so we check this and simply return out of the function if it is not the case (we will handle this in the next function), and otherwise convert the response into a json object to make it easier to parse.
            
            <br /><br />
            <SyntaxHighlighter language="python" style={docco}>
            {make_blocks_batch_request_3}
            </SyntaxHighlighter>     
            <br/>

            This response object will be a vector of length the number of blocks requested, where each entry is the response for the specific block.  Any one of these could in principle have failed for some reason, and so we iterate through the list, checking if there is a result node.  If there is we can insert this into our <Code>blocks</Code> map using the slot number as the key, and mark the entry in the <Code>have_block</Code> vector as <Code>True</Code> so that we know this block has been received.

            <br/><br/>

            This function now returns the map, and the vector which denotes which of the blocks has been successfully requested.  We handle the case where only a subset of the desired blocks have been received in the <Code>get_one_block_batch</Code> function which we show below.

            
            <br /><br />
            <SyntaxHighlighter language="python" style={docco}>
            {get_one_block_batch}
            </SyntaxHighlighter>
            <br/>

            This function is simply responsible for repeatedly calling <Code>make_blocks_batch_request</Code> until the whole of the <Code>have_block</Code> vector of bools has been set to <Code>True</Code>.  For each iteration in the loop it will pass the current state both of this vector, and the blocks map back to <Code>make_blocks_batch_request</Code>, which will only send requests for the blocks that are still missing.  Once it has finished requesting all the blocks in the batch it then returns the map.

            <br/><br/>

            Although in principle these functions could deal with batches of arbitrary size, once they reach a few thousand blocks the endpoint can start to become unresponsive as too many are submitted in a single request.  Although in typical use we will only need to request small numbers of blocks at a time, if for some reason the monitoring server goes down for a period of hours, there can be many thousands of blocks that will need to be requested.
            
            <br/><br/>

            We therefore have one final layer where we take the initial <Code>block_list</Code> that is returned in the main loop, and break it up into chunks of one hundred blocks, and then process each of these chunks separately.  This is done in the <Code>get_blocks</Code> function, which we will now describe below.
            

            <br /><br />
            <SyntaxHighlighter language="python" style={docco}>
            {get_blocks_from_list}
            </SyntaxHighlighter>    
            <br/>

            The first thing we need to do in this function is determine the number of batches we will have to process given our <Code>batch_size</Code> of one hundred.  If this is only one, as will typically be the case, we can just call <Code>get_one_block_batch</Code> directly and no more needs to be done.

            <br /><br />
            <SyntaxHighlighter language="python" style={docco}>
            {get_blocks_from_list_2}
            </SyntaxHighlighter>   
            <br />

            If we have more than one batch then we create a vector that will contain the slot numbers that each batch will be responsible for.  For each entry in <Code>batch_lists</Code> we can then call <Code>get_one_block_batch</Code>, and then build up a single <Code>blocks</Code> map from the results of each batch.  These requests are managed by pythons <Code>ThreadPoolExecutor</Code>, which can submit multiple batches in parallel and then process the results as they complete.  At least with the end point we are using we have found it to be more reliable and faster to maintain a running pool of ten parallel requests, each for 100 blocks, than to submit batches of one thousand blocks in serial, however this may well depend on the end point so if you are implementing something like this yourself, you may just want to test out a range of batch and pool sizes.

            <br /><br />
            <SyntaxHighlighter language="python" style={docco}>
            {get_blocks_from_list_3}
            </SyntaxHighlighter>  
            <br/>


            Returning to the main loop, we simply call the above function after retrieving our list of valid slots:

            <br /><br />
            <SyntaxHighlighter language="python" style={docco}>
            {streamer_get_block}
            </SyntaxHighlighter>  
            

            <h4 id="get-data-header" className="mt-5" style={{fontSize: "18px"}}>Get Block Data</h4><br />


            Each block that we requested has a <Code>transactions</Code> node, which contains a list of all the transactions that were included in that block.  The structure of these transactions can be seen <a style={{textDecoration: "underline"}} href="https://docs.solana.com/developing/clients/jsonrpc-api#transaction-structure">here</a>. The final stage in the monitoring loop is to process our newly downloaded blocks, and record to the database either that no interactions with our on-chain program happened within these transactions, or what those interactions were. 

            <br/><br/>
            
            We do this for a single block in our <Code>get_data_from_block</Code> function, which we will go through below.   

            <br /><br />
            <SyntaxHighlighter language="python" style={docco}>
            {process_block_1}
            </SyntaxHighlighter>
            <br /> 

            Everything that we are interested in is found in the <Code>message</Code> node that exists within each transaction.   This contains an <Code>instructions</Code> node which lists the instructions executed in that transaction, and an <Code>accountKeys</Code> node which lists the public keys used during the transaction, including the programs that were called. Within each instruction there is a <Code>programIdIndex</Code>, which gives the index into <Code>accountKeys</Code> that provides the program public key that executed the instruction.  
            
            <br/><br/>

            In order to find which instructions are relevant to our program then, we simply iterate through all the instructions within each transaction and compare the program public key given by <Code>programIdIndex</Code> with the public key of our program. 

            <br /><br />
            <SyntaxHighlighter language="python" style={docco}>
            {process_block_2}
            </SyntaxHighlighter>
            <br/>

            Once we have found an instruction of interest, we can access the data from the instruction's <Code>data</Code> node, which is encoded as a base58 string.  We can then use the base58 python module to decode this into a byte array, and then use the <Code><a style={{textDecoration: "underline"}} href="https://near.github.io/borsh-construct-py/">borsh_construct</a></Code> module to convert that into a human readable data structure, however this final step requires knowledge of the data structures that the program will be passed.

            <br/><br/>

            In the <a style={{textDecoration: "underline"}}  href="https://github.com/daoplays/solana_examples/tree/master/solana_streamer/program">program</a> source code for this example we can see the definition of the instructions that our on-chain program will accept.  In this case there is only one, and it takes a <Code>ChoiceData</Code> structure as an argument.

            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {program_state}
            </SyntaxHighlighter>
            <br /> 

            The <Code>ChoiceData</Code> structure simply contains a <Code>Choice</Code> enum, and an unsigned 64bit integer representing a quantity.  

            <br /><br />
            <SyntaxHighlighter language="rust" style={docco}>
            {choice_data}
            </SyntaxHighlighter>
            <br />

            We can represent these same structures in python using <Code>borsh_construct</Code>:


            <br /><br />
            <SyntaxHighlighter language="python" style={docco}>
            {python_state}
            </SyntaxHighlighter>
            <br />

            These objects allow us to try and convert a byte array into the given structure type using the <Code>parse</Code> function:


            <br /><br />
            <SyntaxHighlighter language="python" style={docco}>
            {process_block_3}
            </SyntaxHighlighter>
            <br/>

            If this is successful we can then also check that the instruction is of the type we are interested in using the <Code>isinstance</Code> function.  In this example this is trivially true because the program only accepts a single instruction, however in the more general case you may want to distinguish between different program instructions, and only save data for a subset.  If we are interested in the data then we append it to the <Code>data_vec</Code>, which we then return when we are done parsing all the instructions in the block.

            <br/><br/>

            At this point we are almost done! Given a vector of instruction data we convert that into the correct format for our database with the <Code>create_rows_from_data</Code> function:

            <br /><br />
            <SyntaxHighlighter language="python" style={docco}>
            {create_rows_from_data}
            </SyntaxHighlighter>
            <br/>

            Here we denote an empty block as a row with <Code>no_choice</Code> and amount 0, and otherwise access the <Code>choice</Code> and <Code>bid_amount</Code> fields from our <Code>ChoiceData</Code> structure to create each row, incrementing the <Code>row_id</Code> as we go.  These rows can then be added to our database with the <Code>insert_rows</Code> function in sql_funcs.py:


            <br /><br />
            <SyntaxHighlighter language="python" style={docco}>
            {insert_rows}
            </SyntaxHighlighter>
            <br/>

            Here we manually initiate a new database transaction, insert all the rows within the block, and then commit the transaction.  This ensures that all the data for a single block gets committed atomically, and we don't have a situation where the off-chain program looks up the data from a block and happens to check the database in a state where only part of the data for a block has been committed.

            <br/><br/>

            As with requesting the block data, if we are just processing a single block within a particular iteration of the main loop then these functions are just called directly.  Otherwise if there are multiple blocks to be processed we once again use the <Code>concurrent.futures</Code> python module to multithread the processing and create all the new rows in parallel.  Once all the blocks within an iteration have been processed the complete set of new rows are then added to the database in one go in the correct order, as shown below:

            <br /><br />
            <SyntaxHighlighter language="python" style={docco}>
            {streamer_4}
            </SyntaxHighlighter>
            <br/>

            The final step in the loop is to simply update <Code>current_block</Code> with the last block from <Code>block_list</Code>, and then the loop repeats again.



            <h3 id="test-header" className="mt-5" style={{fontSize: "20px"}}>Testing The Monitoring Server</h3><br />

            The monitoring server can be started simply by running <Code>python streamer.py</Code> in the <Code>python</Code> directory of this post's source code.  This will start looking for interactions with a very simple program we are running on the Solana devnet, the code for which is located in the <Code>program</Code> directory, and for which there is a rust client in the <Code>client</Code> directory.

            <br/><br/>

            When this starts running you should see output that looks something like:

            <br /><br />
            <SyntaxHighlighter language="bash" style={docco}>
{`getting current_block from client
Starting with row:  0  Current block:  150660150
requesting from block  150660150
requesting 1 blocks: [150660151]
[ True]
adding row:  (0, 150660151, 'no_choice', 0)`}
            </SyntaxHighlighter>
            <br/>

            While it is running you can then use the client to interact with the program, passing it the location of a paper wallet, the choice you want to make passed as an integer from zero to three, and an amount passed as a final integer, for example:

            <br /><br />
            <SyntaxHighlighter language="bash" style={docco}>
            {`cargo run YOUR_PAPER_WALLET 1 1`}
            </SyntaxHighlighter>
            <br/>

            Once this transaction is processed and ends up in a block you will see it appear in the streamer output as follows:

            <br /><br />
            <SyntaxHighlighter language="bash" style={docco}>
            {`adding row:  (90, 150660257, 'Choice.B()', 1)`}
            </SyntaxHighlighter>
            <br/>

            At any point you should be able to stop the monitoring server, and then restart it and it should just pick up where you left off, downloading any new blocks that have been finalized since you stopped monitoring.  As we mentioned at the start, monitoring the Solana blockchain in this way takes quite a lot of requests, you can see our call history over the last few weeks as we have been running this server to test it before our app launch:

            <br/><br/>
            <Box maxWidth="100%">
                <Center>
                    <Box>
                        <Image  fluid="true" src={quicknode_img}/>
                    </Box>
                </Center>
            </Box>
            <br/><br/>

            On average we are making about three hundred thousand requests a day, or about nine million a month!   This is actually slightly worse on devnet than it would be on mainnet as the rate at which blocks are produced is about double on devnet, and so requires correspondingly more requests be made.

            <br/><br/>

            Thats it!  We hope that you have found this post informative, and if so feel free to follow us on <a style={{textDecoration: "underline"}} href="http://www.twitter.com/dao_plays">Twitter</a> to keep up to date with future posts!


            </main>
        </div>
    

    );
}

function SolanaStreamer() {
    return (
        <ChakraProvider theme={theme}>
                <PostContent />
                
        </ChakraProvider>
        
    );
    }

export default SolanaStreamer;
