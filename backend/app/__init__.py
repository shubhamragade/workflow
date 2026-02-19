from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_marshmallow import Marshmallow
from flask_cors import CORS
from .config import Config

db = SQLAlchemy()
ma = Marshmallow()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    ma.init_app(app)
    CORS(app)

    with app.app_context():
        # Import and register blueprints here
        from .routes import bp
        app.register_blueprint(bp)
        
        db.create_all()

    return app
