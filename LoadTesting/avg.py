import csv
import sys

if len(sys.argv) != 2:
    sys.exit(1)

def calculate_average(csv_file):
    with open(csv_file, 'r') as file:
        reader = csv.reader(file)
        
        # Skip the header if there is one
        next(reader, None)
        
        # Initialize variables for the sum and count
        total = 0
        count = 0
        
        # Iterate through each row and add the value in the second column to the sum
        for row in reader:
            try:
                value = float(row[1])
                
                if value > 2000:
                    continue

                total += value
                count += 1
            except (ValueError, IndexError):
                # Handle cases where the value is not a valid float or the column doesn't exist
                print(f"Skipping row {row}")
        
        # Calculate the average
        if count > 0:
            average = total / count
            return average
        else:
            return 0

average_value = calculate_average(sys.argv[1])

print(f"Average message latency: {average_value}")