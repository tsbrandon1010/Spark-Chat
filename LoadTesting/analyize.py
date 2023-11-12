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

    

    
    for j in range(len(rows[:2180])):
        print(f"Total latency: {int(rows[j][11]) - int(rows[j][1])}")

        for i in range(0, len(rows[j]), 2):
            try:
                print(f"{rows[j][i]} -> {rows[j][i + 2]}: {int(rows[j][i + 3]) - int(rows[j][i + 1])}")
            except:
                pass
        print("\n")

main(sys.argv[1])