import io
import base64
import json
import numpy as np
import pandas as pd
import matplotlib
from scipy import stats
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import seaborn as sns
from flask import request, jsonify
from app import app

import rpy2.robjects as robjects
from rpy2.robjects import pandas2ri
from rpy2.robjects.packages import importr

pandas2ri.activate()

try:
    meta = importr('meta')
    metafor = importr('metafor')
    base = importr('base')
except Exception as e:
    print(f"Warning: R package import error: {e}")
    print("Some functionality may be limited")

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'message': 'Flask statistics API is running'
    })

@app.route('/analyze', methods=['POST'])
def analyze_data():
    """
    Analyze meta-analysis data and return statistical results
    
    Expected JSON input:
    {
        "studies": [
            {
                "title": "Study A",
                "n": 120,
                "effect_size": 1.2,
                "ci_low": 1.0,
                "ci_high": 1.4
            },
            ...
        ],
        "analysis_type": "random_effects"  // or "fixed_effects"
    }
    
    Returns:
    - Forest plot (base64)
    - Funnel plot (base64)
    - Heterogeneity statistics (I², Q, p-value)
    - Summary effect size with confidence intervals
    """
    try:
        data = request.get_json()
        
        if not data or 'studies' not in data:
            return jsonify({
                'error': 'Invalid input data',
                'message': 'Request must include "studies" array'
            }), 400
        
        studies = data.get('studies', [])
        analysis_type = data.get('analysis_type', 'random_effects')
        
        if len(studies) < 2:
            return jsonify({
                'error': 'Insufficient data',
                'message': 'Meta-analysis requires at least 2 studies'
            }), 400
        
        df = pd.DataFrame(studies)
        
        df['se'] = (df['ci_high'] - df['ci_low']) / (2 * 1.96)
        
        forest_plot_img = generate_forest_plot(df, analysis_type)
        
        funnel_plot_img = generate_funnel_plot(df)
        
        stats = calculate_meta_stats(df, analysis_type)
        
        return jsonify({
            'forest_plot': forest_plot_img,
            'funnel_plot': funnel_plot_img,
            'heterogeneity': stats['heterogeneity'],
            'summary': stats['summary']
        })
        
    except Exception as e:
        print(f"Error in analyze_data: {str(e)}")
        return jsonify({
            'error': 'Analysis failed',
            'message': str(e)
        }), 500

def generate_forest_plot(df, analysis_type):
    """Generate forest plot using matplotlib"""
    try:
        return generate_forest_plot_r(df, analysis_type)
    except Exception as e:
        print(f"R forest plot failed: {e}, falling back to matplotlib")
        plt.figure(figsize=(10, len(df) * 0.8 + 3))
        
        y_positions = np.arange(len(df))
        plt.errorbar(
            df['effect_size'], 
            y_positions,
            xerr=np.array([
                np.abs(df['effect_size'] - df['ci_low']),
                np.abs(df['ci_high'] - df['effect_size'])
            ]),
            fmt='o',
            capsize=5
        )
        
        plt.yticks(y_positions, df['title'])
        
        plt.axvline(x=1.0, color='gray', linestyle='--')
        
        plt.xlabel('Effect Size')
        plt.title('Forest Plot')
        plt.tight_layout()
        
        buffer = io.BytesIO()
        plt.savefig(buffer, format='png')
        buffer.seek(0)
        plt.close()
        
        return base64.b64encode(buffer.getvalue()).decode('utf-8')

def generate_forest_plot_r(df, analysis_type):
    """Generate forest plot using R's meta package"""
    r_df = pandas2ri.py2rpy(df)
    
    if analysis_type == 'fixed_effects':
        method = "fixed"
    else:
        method = "random"
    
    meta_result = meta.metagen(
        TE=robjects.FloatVector(df['effect_size']),
        seTE=robjects.FloatVector(df['se']),
        studlab=robjects.StrVector(df['title']),
        sm="RR",  # Risk Ratio
        method=method,
        hakn=False
    )
    
    buffer = io.BytesIO()
    
    grdevice = robjects.r('png')
    grdevice(file=robjects.r('tempfile')(fileext=".png"), width=1000, height=800)
    
    meta.forest(meta_result)
    
    robjects.r('dev.off()')
    plot_file = robjects.r('dev.off()')
    
    with open(plot_file[0], 'rb') as f:
        plot_data = f.read()
    
    return base64.b64encode(plot_data).decode('utf-8')

def generate_funnel_plot(df):
    """Generate funnel plot using matplotlib"""
    try:
        return generate_funnel_plot_r(df)
    except Exception as e:
        print(f"R funnel plot failed: {e}, falling back to matplotlib")
        plt.figure(figsize=(8, 6))
        
        plt.scatter(df['effect_size'], df['se'])
        
        plt.gca().invert_yaxis()
        
        plt.xlabel('Effect Size')
        plt.ylabel('Standard Error')
        plt.title('Funnel Plot')
        
        mean_effect = np.average(df['effect_size'], weights=1/df['se']**2)
        plt.axvline(x=mean_effect, color='gray', linestyle='--')
        
        buffer = io.BytesIO()
        plt.savefig(buffer, format='png')
        buffer.seek(0)
        plt.close()
        
        return base64.b64encode(buffer.getvalue()).decode('utf-8')

def generate_funnel_plot_r(df):
    """Generate funnel plot using R's meta package"""
    r_df = pandas2ri.py2rpy(df)
    
    meta_result = meta.metagen(
        TE=robjects.FloatVector(df['effect_size']),
        seTE=robjects.FloatVector(df['se']),
        studlab=robjects.StrVector(df['title']),
        sm="RR",  # Risk Ratio
        method="random",
        hakn=False
    )
    
    buffer = io.BytesIO()
    
    grdevice = robjects.r('png')
    grdevice(file=robjects.r('tempfile')(fileext=".png"), width=800, height=800)
    
    meta.funnel(meta_result)
    
    robjects.r('dev.off()')
    plot_file = robjects.r('dev.off()')
    
    with open(plot_file[0], 'rb') as f:
        plot_data = f.read()
    
    return base64.b64encode(plot_data).decode('utf-8')

def calculate_meta_stats(df, analysis_type):
    """Calculate meta-analysis statistics"""
    try:
        return calculate_meta_stats_r(df, analysis_type)
    except Exception as e:
        print(f"R statistics failed: {e}, falling back to numpy")
        weights = 1 / df['se']**2
        weighted_mean = np.average(df['effect_size'], weights=weights)
        
        se_weighted_mean = np.sqrt(1 / np.sum(weights))
        ci_low = weighted_mean - 1.96 * se_weighted_mean
        ci_high = weighted_mean + 1.96 * se_weighted_mean
        
        q_stat = np.sum(weights * (df['effect_size'] - weighted_mean)**2)
        df_q = len(df) - 1
        p_value = 1 - stats.chi2.cdf(q_stat, df_q)
        i_squared = max(0, 100 * (q_stat - df_q) / q_stat)
        
        return {
            'heterogeneity': {
                'i_squared': float(i_squared),
                'q_statistic': float(q_stat),
                'p_value': float(p_value),
                'df': int(df_q)
            },
            'summary': {
                'effect_size': float(weighted_mean),
                'ci_low': float(ci_low),
                'ci_high': float(ci_high),
                'se': float(se_weighted_mean)
            }
        }

def calculate_meta_stats_r(df, analysis_type):
    """Calculate meta-analysis statistics using R's meta package"""
    r_df = pandas2ri.py2rpy(df)
    
    if analysis_type == 'fixed_effects':
        method = "fixed"
    else:
        method = "random"
    
    meta_result = meta.metagen(
        TE=robjects.FloatVector(df['effect_size']),
        seTE=robjects.FloatVector(df['se']),
        studlab=robjects.StrVector(df['title']),
        sm="RR",  # Risk Ratio
        method=method,
        hakn=False
    )
    
    i_squared = meta_result.slots['I2']
    q_stat = meta_result.slots['Q']
    p_value = meta_result.slots['pval.Q']
    df_q = meta_result.slots['df.Q']
    
    effect_size = meta_result.slots['TE.random'] if method == "random" else meta_result.slots['TE.fixed']
    ci_low = meta_result.slots['lower.random'] if method == "random" else meta_result.slots['lower.fixed']
    ci_high = meta_result.slots['upper.random'] if method == "random" else meta_result.slots['upper.fixed']
    se = meta_result.slots['seTE.random'] if method == "random" else meta_result.slots['seTE.fixed']
    
    return {
        'heterogeneity': {
            'i_squared': float(i_squared[0]),
            'q_statistic': float(q_stat[0]),
            'p_value': float(p_value[0]),
            'df': int(df_q[0])
        },
        'summary': {
            'effect_size': float(effect_size[0]),
            'ci_low': float(ci_low[0]),
            'ci_high': float(ci_high[0]),
            'se': float(se[0])
        }
    }

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
