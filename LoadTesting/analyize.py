import csv
import sys

if len(sys.argv) != 2:
    sys.exit(1)


def main(csv_file):

    
    rows = []
    with open(csv_file, "r") as f:
        reader = csv.reader(f)

        next(reader, None)
        for row in reader:
            rows.append(row)

    
    count = 0
    low = 9999
    high = 0

    for j in range(len(rows)):
        
        if len(rows[j]) == 0:
            continue
        
        total_latency = int(rows[j][11]) - int(rows[j][1])
        print(f"Total latency: {total_latency}")

        count += total_latency
        if total_latency < low:
            low = total_latency
        elif total_latency > high:
            high = total_latency

        for i in range(0, len(rows[j]), 2):
            try:
                print(f"{rows[j][i]} -> {rows[j][i + 2]}: {int(rows[j][i + 3]) - int(rows[j][i + 1])}")
            except:
                pass
        print("\n")

    print("average latency", count / len(rows))
    print("highest latency", high)
    print("lowest latency", low)


main(sys.argv[1])