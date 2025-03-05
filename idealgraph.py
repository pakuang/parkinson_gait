import zipfile
import os
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

demographics_txt_path = "gait-in-parkinsons-disease-1.0.0/demographics.txt"

# 3. **Loading the Demographics Data**
demographics_df = pd.read_csv(demographics_txt_path, sep="\t", engine="python", error_bad_lines=False)

# 4. **Ensuring "Speed_01" is Numeric**
demographics_df["Speed_01"] = pd.to_numeric(demographics_df["Speed_01"], errors="coerce")

# 5. **Filtering Out Missing Values in "Speed_01"**
filtered_df = demographics_df.dropna(subset=["Speed_01"])

# 6. **Creating the Histogram with KDE Overlay**
plt.figure(figsize=(10, 6))

sns.histplot(filtered_df, x="Speed_01", hue="Group", kde=True, bins=20, palette="coolwarm", alpha=0.6)

plt.xlabel("Gait Speed (Speed_01)")
plt.ylabel("Count")
plt.title("Gait Speed Distribution with KDE Overlay (Parkinson's vs. Control)")
plt.legend(title="Group", labels=["Parkinson's", "Control"])
plt.show()
