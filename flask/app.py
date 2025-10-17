import os
from flask import Flask, request, jsonify
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, regexp_extract
import shutil
from elasticsearch import Elasticsearch
from flask_cors import CORS  
import requests
from functools import reduce
from kafka import KafkaConsumer
from kafka import KafkaProducer
import smtplib
from email.mime.text import MIMEText  # Import MIMEText

app = Flask(__name__)
CORS(app)  # This will allow all origins. You can customize it later if needed.

# Set PySpark environment
os.environ["PYSPARK_SUBMIT_ARGS"] = (
    "--packages "
    "org.apache.spark:spark-streaming-kafka-0-10_2.12:3.4.1,"
    "org.apache.spark:spark-sql-kafka-0-10_2.12:3.4.1,"
    "org.elasticsearch:elasticsearch-spark-30_2.12:8.10.2 "
    "pyspark-shell"
)



# Create SparkSession
spark = SparkSession.builder \
    .appName("DynamicLogProcessor") \
    .master("local[*]") \
    .config("spark.sql.streaming.schemaInference", "true") \
    .getOrCreate()

UPLOAD_FOLDER = "./uploaded_logs"
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Email Configuration
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USER = "abdelli.dhia.edinne@gmail.com"  # Replace with your email
SMTP_PASSWORD = "ibse lkpc slti thvl"  # Replace with your app password
RECIPIENT_EMAIL = "ahlem.hafedh@ihec.ucar.tn"  # Replace with the recipient email


@app.route('/upload-log', methods=['POST'])
def upload_log():
    """
    Upload log file and trigger processing.
    """
    try:
        # Debug: Log incoming request details
        print("request.files:", request.files)
        print("request.form:", request.form)

        # Check if required data is in the request
        if 'logFile' not in request.files or 'pattern' not in request.form:
            return jsonify({"error": "File and pattern are required."}), 400

        log_file = request.files['logFile']
        pattern = request.form['pattern']

        # Save the uploaded file
        log_filename = log_file.filename
        file_path = os.path.join(UPLOAD_FOLDER, log_filename)

        try:
            log_file.save(file_path)
        except Exception as e:
            print("File save error:", str(e))
            return jsonify({"error": f"Failed to save file: {str(e)}"}), 500

        # Trigger log processing (optional)
        produce_logs_to_kafka(pattern,log_filename,file_path)

        return jsonify({"message": "Log processing started successfully."}), 200

    except Exception as e:
        print("Unexpected error:", str(e))
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500





def produce_logs_to_kafka(pattern, file_name, file_path):
    """
    Produce logs to Kafka topic dynamically based on pattern, file name, and file path.
    
    Args:
    pattern (str): The pattern used to define the Kafka topic.
    file_name (str): The name of the log file to be sent.
    file_path (str): The full file path where the log file is located.
    """
    # Create the Kafka topic name
    topic_name = f"{pattern}-{file_name.split('.')[0]}"  # Topic name: pattern-file_name

    # Configure the Kafka Producer
    producer = KafkaProducer(
        bootstrap_servers='localhost:9092',
        batch_size=1000,  # Maximum batch size in bytes (adjust as needed)
        linger_ms=100,      # Wait for 10ms to batch messages
        value_serializer=lambda v: v  # Just send the raw message as a string
    )

    # Check if the file exists at the given file path
    if not os.path.exists(file_path):
        print(f"Error: File '{file_path}' not found.")
        return

    # Read the log file and send logs to Kafka
    with open(file_path, 'r') as file:
        lines = file.readlines()

        # Send logs to the corresponding topic
        for line in lines:
            producer.send(topic_name, value=line.encode('utf-8'))

        print(f"Sent logs from {file_name} to topic {topic_name}")

    # Ensure all messages are sent
    producer.flush()

    print(f"Log data from file '{file_name}' sent to Kafka topic '{topic_name}'.")
    os.remove(file_path)
    process_logs_from_kafka(topic_name,pattern)

 

def process_logs_from_kafka(topic_name, pattern):
    """
    Consume logs from Kafka topic, apply filters from Elasticsearch, and save to Elasticsearch.
    
    Args:
    topic_name (str): The name of the Kafka topic to consume.
    pattern (str): The pattern used to fetch filters from Elasticsearch.
    """
    # Fetch patterns from Elasticsearch
    patterns = fetch_patterns_from_elasticsearch(pattern)
    if not patterns:
        raise ValueError(f"No patterns found for {pattern}")

    log_filters = patterns.get("log_filter", {})
    error_filters = patterns.get("error_filter", {})
    print(log_filters)

    # Create Kafka consumer to consume data from the Kafka topic
    consumer = KafkaConsumer(
        topic_name,
        bootstrap_servers='localhost:9092',
        group_id='log_processor_group',
        auto_offset_reset='earliest'
    )

    # Prepare the schema for reading logs
    raw_logs_df = spark.readStream \
        .format("kafka") \
        .option("kafka.bootstrap.servers", "localhost:9092") \
        .option("subscribe", topic_name) \
        .option("startingOffsets", "earliest") \
        .option("fetch.max.bytes", "1048576") \
        .option("max.partition.fetch.bytes", "1048576") \
        .option("failOnDataLoss", "false") \
        .load()
    logs_df = raw_logs_df.selectExpr("CAST(value AS STRING) AS text")
    # Process Normal Logs
    # def process_normal_logs(df):
    #     extracted_normal_columns = []
    #     for column_name, regex in log_filters.items():
    #         print(f"Processing column: {column_name} with regex: {regex}")
            
    #         # Clean up column name (in case of extra quotes)
    #         clean_column_name = column_name.strip('"')  
            
    #         # Determine the group index for each column (adjust this depending on the structure of your regex)
    #         # For Level, Component, Content, the regex should use group 1, and for Date/Time it should use group 0
    #         group_index = 1 if clean_column_name in ["Level", "Component", "Content"] else 0
            
    #         # Apply the regex extraction
    #         df = df.withColumn(clean_column_name, regexp_extract(col("text"), regex, group_index))
            
    #         # Add the column to the list of extracted columns
    #         extracted_normal_columns.append(clean_column_name)
            
    #     # Print the extracted column names for debugging
    #     print(f"Extracted columns: {extracted_normal_columns}")  

    #     # Apply filter to remove rows with null values in any of the extracted columns
    #     if extracted_normal_columns:
    #         filter_conditions = [col(col_name).isNotNull() for col_name in extracted_normal_columns]
    #         df = df.filter(reduce(lambda a, b: a | b, filter_conditions))
        
    #     return df
    
    def process_logs_static(logs_df):
        """
        Process logs using static logic to test functionality.
        """
        # Static processing logic
        normal_logs_df = logs_df.filter(
            regexp_extract(col("text"), r"^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3}", 0) != ""
        ).withColumn("Date", regexp_extract(col("text"), r"^\d{4}-\d{2}-\d{2}", 0)) \
        .withColumn("Time", regexp_extract(col("text"), r"\d{2}:\d{2}:\d{2},\d{3}", 0)) \
        .withColumn("Level", regexp_extract(col("text"), r"(INFO|DEBUG|ERROR|WARN|FATAL)", 1)) \
        .withColumn("Component", regexp_extract(col("text"), r"([a-zA-Z.]+):", 1)) \
        .withColumn("Content", regexp_extract(col("text"), r": (.+)", 1))
            
        return normal_logs_df



    

    def process_error_logs_static(logs_df):
        java_error_df = logs_df.filter(col("text").rlike(r"java\.\S+Exception")) \
            .withColumn("error_type", regexp_extract(col("text"), r"(java\.\S+Exception)", 1)) \
            .withColumn("local_host", regexp_extract(col("text"), r"Call From ([a-zA-Z0-9.-]+)", 1)) \
            .withColumn("destination_host", regexp_extract(col("text"), r"to ([a-zA-Z0-9.-]+:\d+)", 1)) \
            .select("error_type", "local_host", "destination_host")
            
        return java_error_df

    java_error_df = process_error_logs_static(logs_df)
    normal_logs_df = process_logs_static(logs_df)  # Start with non-null values

    # Process Error Logs
    # def process_error_logs(df):
    #     extracted_error_columns = []
    #     for column_name, regex in error_filters.items():
    #         df = df.withColumn(column_name, regexp_extract(col("text"), regex, 1))
    #         extracted_error_columns.append(column_name)

    #     if extracted_error_columns:
    #         filter_conditions = [
    #             col(col_name).isNotNull() for col_name in extracted_error_columns
    #         ]
    #         df = df.filter(reduce(lambda a, b: a | b, filter_conditions))
    #     return df

    

    error_logs_index = f"{topic_name}-errors"
    es_java_error_options = {
        "es.nodes": "localhost",
        "es.port": "9200",
        "es.index.auto.create": "true",
        "es.resource": error_logs_index
    }

    
    # # Write Java errors to Elasticsearch
    java_error_df.writeStream \
        .format("org.elasticsearch.spark.sql") \
        .options(**es_java_error_options) \
        .outputMode("append") \
        .option("es.spark.sql.streaming.sink.log.enabled", "false") \
        .option("checkpointLocation", "./error_logs_checkpoint") \
        .start() \
        .awaitTermination()

    # Define Elasticsearch options for normal logs


    normal_logs_index = f"{topic_name}-logs"
    es_normal_logs_options = {
        "es.nodes": "localhost",
        "es.port": "9200",
        "es.index.auto.create": "true",
        "es.resource": normal_logs_index
    }

    # # Write normal logs to Elasticsearch
    normal_logs_df.writeStream \
        .format("org.elasticsearch.spark.sql") \
        .options(**es_normal_logs_options) \
        .outputMode("append") \
        .option("es.spark.sql.streaming.sink.log.enabled", "false") \
        .option("checkpointLocation", "./normal_logs_checkpoint") \
        .start() \
        .awaitTermination()

    # java_error_df.writeStream \
    #     .format("console") \
    #     .outputMode("append") \
    #     .start() \
    #     .awaitTermination()

    # # Define Elasticsearch options for error logs
  


# Initialize Elasticsearch client
es = Elasticsearch(hosts=["http://localhost:9200"])

def fetch_patterns_from_elasticsearch(pattern_name):
    """
    Fetch patterns from Elasticsearch.
    """
    try:
        response = requests.post(
            "http://localhost:9200/patterns/_search",
            json={"query": {"match": {"pattern_name": pattern_name}}},
            headers={"Content-Type": "application/json"}
        )
        response.raise_for_status()
        data = response.json()
        if data.get("hits", {}).get("total", {}).get("value", 0) > 0:
            return data["hits"]["hits"][0]["_source"]
        else:
            return None
    except Exception as e:
        print(f"Error fetching patterns from Elasticsearch: {e}")
        return None


@app.route('/save-pattern', methods=['POST'])
def save_pattern():
    """
    Endpoint to save pattern details into Elasticsearch and process filters.
    """
    try:
        # Get the JSON payload from the request
        data = request.json
        if not data:
            return jsonify({"error": "No data provided."}), 400

        # Extract the pattern name
        pattern_name = data.get("pattern_name")

        # Get the filters and process them using the helper function
        log_filter = process_log(data.get("log_filter"))
        error_filter = process_log(data.get("error_filter"))

        if not pattern_name or not log_filter or not error_filter:
            return jsonify({"error": "Pattern name, log filter, and error filter are required."}), 400

        # Prepare the document for Elasticsearch
        document = {
            "pattern_name": pattern_name,
            "log_filter": log_filter,
            "error_filter": error_filter
        }

        # Save the document to Elasticsearch "patterns" index
        es.index(index="patterns", document=document)

        return jsonify({
            "message": "Pattern and filters processed and saved successfully.",
            "pattern_details": document
        }), 200

    except Exception as e:
        print(e)
        return jsonify({"error": str(e)}), 500


def process_log(filter_string):
    """
    Helper function to process the filter string and return a dictionary of key-value pairs.
    """
    if not filter_string:
        return {}

    filters = {}
    filter_pairs = filter_string.split(",")  # Split by comma

    # Process each key-value pair
    for pair in filter_pairs:
        # Try splitting by the first colon (key:value) and handle errors
        try:
            key, value = pair.split(":", 1)  # Split by the first colon (key:value)
            filters[key.strip()] = value.strip()  # Remove any extra spaces
        except ValueError:
            # If the split fails (not enough values), log a warning and continue
            print(f"Warning: Skipping invalid filter pair: {pair}")
    
    return filters


def send_email_alert(subject, body, previous_count, new_count, index_name):
    """Send an email alert with HTML formatting."""
    try:
        # Create an HTML template
        html_body = f"""
       <html>
    <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f8d7da;">
        <div style="max-width: 600px; margin: 20px auto; background: #ffffff; padding: 20px; border: 2px solid #dc3545; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #dc3545; text-align: center; margin-bottom: 20px;">⚠️ Index Error Alert ⚠️</h2>
            <p style="color: #333333; font-size: 16px;">
                The index <strong style="color: #007bff;">{index_name}</strong> has experienced an update with new error data.
            </p>
            <div style="background-color: #f8d7da; padding: 10px; border: 1px solid #f5c2c7; border-radius: 5px; margin: 20px 0;">
                <p style="color: #842029; margin: 0; font-size: 16px; text-align: center;">
                    <strong>ERROR Count Change:</strong>
                    <span style="color: #28a745;">{previous_count}</span>
                    →
                    <span style="color: #dc3545; font-weight: bold;">{new_count}</span>
                </p>
            </div>
            <p style="color: #842029; font-size: 14px; margin-bottom: 20px; text-align: center;">
                🚨 The error count has increased. Immediate attention is recommended! 🚨
            </p>
            <hr style="border: none; border-top: 1px solid #dddddd; margin: 20px 0;">
            <footer style="text-align: center; color: #aaaaaa; font-size: 12px;">
                <p>Generated by Your System</p>
                <p style="margin: 0;">&copy; 2025</p>
            </footer>
        </div>
    </body>
</html>
        """

        # Create an HTML MIMEText object
        msg = MIMEText(html_body, "html")
        msg["Subject"] = subject
        msg["From"] = SMTP_USER
        msg["To"] = RECIPIENT_EMAIL

        # Send the email
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_USER, RECIPIENT_EMAIL, msg.as_string())

        print(f"[INFO] Email successfully sent to {RECIPIENT_EMAIL}")
    except Exception as e:
        print(f"[ERROR] Error while sending email: {e}")


@app.route('/send-email', methods=['POST'])
def handle_send_email():
    """Handle email sending request."""
    data = request.json
    subject = data.get('subject')
    body = data.get('body')
    previous_count = data.get('previous_count')
    new_count = data.get('new_count')
    index_name = data.get('index_name')

    if not all([subject, body, previous_count, new_count, index_name]):
        return jsonify({"error": "All fields (subject, body, previous_count, new_count, index_name) are required"}), 400

    try:
        send_email_alert(subject, body, previous_count, new_count, index_name)
        return jsonify({"success": True, "message": "Email sent successfully"}), 200
    except Exception as e:
        return jsonify({"error": f"Error sending email: {str(e)}"}), 500




if __name__ == '__main__':
    app.run(debug=True)
