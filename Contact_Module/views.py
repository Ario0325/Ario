from django.shortcuts import render, redirect
from django.contrib import messages
from django.views.decorators.http import require_POST
from django_ratelimit.decorators import ratelimit
from .models import ContactMessage, ContactInfo
from .Forms import ContactForm


@ratelimit(key='ip', rate='5/m', block=True)
@ratelimit(key='post:email', rate='10/d', block=True)
def contact_view(request):
    """Contact form view with rate limiting"""
    contact_info = ContactInfo.objects.filter(is_active=True).first()

    if request.method == 'POST':
        form = ContactForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, 'پیام شما با موفقیت ارسال شد. به زودی با شما تماس خواهیم گرفت.')
            return redirect('contact')
        else:
            messages.error(request, 'لطفا اطلاعات را به درستی وارد کنید.')
    else:
        form = ContactForm()

    context = {
        'form': form,
        'contact_info': contact_info
    }
    return render(request, 'Contact_Module/Contact.html', context)