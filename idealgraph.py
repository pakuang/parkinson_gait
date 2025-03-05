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

# Remove NaN values for gait speed
filtered_df = demographics_df.dropna(subset=["Speed_01"])

# Extract Speed_01 values for each group
parkinsons_speed = filtered_df.loc[filtered_df["Group"] == 1, "Speed_01"].tolist()
control_speed = filtered_df.loc[filtered_df["Group"] == 2, "Speed_01"].tolist()
