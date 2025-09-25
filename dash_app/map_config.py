"""
Shared map configuration for the Dash application
"""
import plotly.graph_objects as go

# Define the available map styles
map_styles = [
    ("Streets", "mapbox://styles/mapbox/streets-v12"),
    ("Satellite", "mapbox://styles/mapbox/satellite-streets-v12"),
    ("Dark", "mapbox://styles/mapbox/dark-v11"),
]

# Create the button
buttons = []
for label, style in map_styles:
    buttons.append(
        dict(
            label=label,
            method="relayout",
            args=[{"mapbox.style": style}]
        )
    )

# Adds button to map   
updatemenus = [
    go.layout.Updatemenu(
        buttons=buttons,
        direction="down",
        showactive=True,
        x=0,
        xanchor="left",
        y=1,
        yanchor="top"
    )
]