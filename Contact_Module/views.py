from django.shortcuts import render, redirect
from django.contrib import messages
from .models import ContactMessage, ContactInfo
from .Forms import ContactForm


def contact_view(request):
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