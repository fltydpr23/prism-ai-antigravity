#!/bin/bash
echo "Setting up Python Quantitative Engine for Prism..."

# Check if uv is installed, if not try to use python3 venv
if command -v uv &> /dev/null; then
    echo "Using 'uv' to create virtual environment..."
    uv venv .venv
    source .venv/bin/activate
    uv pip install pandas scipy scikit-learn statsmodels lifelines
else
    echo "Using standard 'python3' to create virtual environment..."
    /usr/bin/python3 -m venv .venv
    source .venv/bin/activate
    pip install pandas scipy scikit-learn statsmodels lifelines
fi

echo "Done! The Python environment is ready."
