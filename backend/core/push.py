import json
from pywebpush import webpush, WebPushException
from core.config import settings

def send_push_notification(subscription_info, message_body):
    """
    Sends a web push notification using pywebpush.
    
    subscription_info: dict with 'endpoint', 'keys': {'p256dh', 'auth'}
    message_body: str or dict to be sent as the payload
    """
    try:
        # If payload is a dict, convert it to JSON string
        payload = message_body
        if isinstance(message_body, dict):
            payload = json.dumps(message_body)
            
        print(f"Sending push to {subscription_info['endpoint']}")
        
        response = webpush(
            subscription_info=subscription_info,
            data=payload,
            vapid_private_key=settings.vapid_private_key,
            vapid_claims={"sub": settings.vapid_mailto}
        )
        return response.ok
    except WebPushException as ex:
        print(f"WebPush error: {ex}")
        # If the response is a 410 Gone or 404 Not Found, the subscription is expired/invalid
        if ex.response and ex.response.status_code in [404, 410]:
            print("Subscription expired or invalid.")
            # We would ideally return something here to tell the caller to delete this sub
            return False
        return False
    except Exception as e:
        print(f"General push error: {e}")
        return False
