# Exercise Configuration and Model Settings

EXERCISE_CONFIG = {
    'training_epochs': 50,
    'batch_size': 32,
    'learning_rate': 0.001,
    'validation_split': 0.2
}

MODEL_SETTINGS = {
    'model_type': 'neural_network',
    'layers': [
        {'type': 'dense', 'units': 64, 'activation': 'relu'},
        {'type': 'dense', 'units': 32, 'activation': 'relu'},
        {'type': 'output', 'units': 1, 'activation': 'sigmoid'}
    ],
    'optimizer': 'adam'
}